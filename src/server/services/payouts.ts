import 'server-only';
import { createHash } from 'node:crypto';
import { Address } from '@ton/core';
import { MIN_WITHDRAWAL_CENTS, PAYOUT_ASSET } from '@/lib/constants';
import type { Payouts, PayoutWallet, WithdrawalSummary } from '@/lib/api/types';
import type { Evaluator } from '@/server/auth/tma';
import { prisma } from '@/server/db';
import { appUrl, env, requireEnv } from '@/server/env';
import { errors, isUniqueViolation } from '@/server/errors';
import { clawbackPendingRewards, releaseMaturedRewards } from '@/server/ledger';
import { createProofPayload, isValidProofPayload, TON_NETWORKS, TonProofError, verifyTonProof, type TonProofInput } from '@/server/ton/proof';
import { OPEN_WITHDRAWAL_STATUSES } from '@/server/withdrawals';
import { isSuspended } from './trust';

// The evaluator's side of getting paid: rewards maturing, linking a TON wallet, and
// asking for a withdrawal. Review and sending happen in scripts/payouts.ts.

/**
 * Releases rewards whose hold period has ended, or claws everything back if the
 * evaluator has been suspended. Runs whenever the evaluator looks at their money,
 * so no scheduled job is needed.
 */
export async function settleRewards(evaluator: Evaluator) {
  await prisma.$transaction((tx) =>
    isSuspended(evaluator) ? clawbackPendingRewards(tx, evaluator.id) : releaseMaturedRewards(tx, evaluator.id),
  );
}

function proofSecret() {
  return createHash('sha256').update(`ton-proof:${requireEnv('BOT_TOKEN')}`).digest('hex');
}

function friendlyAddress(raw: string) {
  return Address.parseRaw(raw).toString({ bounceable: false, testOnly: env().TON_NETWORK === 'testnet' });
}

function toSummary(withdrawal: {
  id: string;
  amountCents: number;
  status: WithdrawalSummary['status'];
  address: string;
  txHash: string | null;
  createdAt: Date;
}): WithdrawalSummary {
  return {
    id: withdrawal.id,
    amountCents: withdrawal.amountCents,
    status: withdrawal.status,
    address: friendlyAddress(withdrawal.address),
    txHash: withdrawal.txHash,
    createdAt: withdrawal.createdAt.toISOString(),
  };
}

export async function getPayouts(evaluator: Evaluator): Promise<Payouts> {
  await settleRewards(evaluator);
  const [user, wallet, nextRelease, withdrawals] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: evaluator.id }, select: { balanceCents: true, pendingCents: true } }),
    prisma.tonWallet.findUnique({ where: { userId: evaluator.id } }),
    prisma.ledgerEntry.findFirst({
      where: { userId: evaluator.id, type: 'TASK_REWARD', bucket: 'PENDING', settledAt: null },
      orderBy: { availableAt: 'asc' },
      select: { availableAt: true },
    }),
    prisma.withdrawal.findMany({ where: { userId: evaluator.id }, orderBy: { createdAt: 'desc' }, take: 10 }),
  ]);

  const linked: PayoutWallet | null = wallet
    ? { address: friendlyAddress(wallet.address), linkedAt: wallet.createdAt.toISOString() }
    : null;

  return {
    balanceCents: user.balanceCents,
    pendingCents: user.pendingCents,
    nextReleaseAt: nextRelease?.availableAt?.toISOString() ?? null,
    minWithdrawalCents: MIN_WITHDRAWAL_CENTS,
    asset: PAYOUT_ASSET,
    network: env().TON_NETWORK,
    canWithdraw: !isSuspended(evaluator),
    wallet: linked,
    withdrawals: withdrawals.map(toSummary),
  };
}

export function getProofPayload(evaluator: Evaluator) {
  return { payload: createProofPayload(evaluator.id, proofSecret()) };
}

async function assertNoOpenWithdrawal(userId: string, action: string) {
  const open = await prisma.withdrawal.count({ where: { userId, status: { in: OPEN_WITHDRAWAL_STATUSES } } });
  if (open > 0) throw errors.conflict('WITHDRAWAL_OPEN', `You can ${action} once your current withdrawal is finished.`);
}

export async function linkWallet(evaluator: Evaluator, input: TonProofInput) {
  if (!isValidProofPayload(input.proof.payload, evaluator.id, proofSecret())) {
    throw errors.validation('This connection request has expired. Try connecting again.');
  }

  let address: string;
  try {
    address = verifyTonProof(input, {
      domain: new URL(appUrl()).host,
      network: TON_NETWORKS[env().TON_NETWORK],
    });
  } catch (error) {
    if (error instanceof TonProofError) throw errors.validation(error.message);
    throw error;
  }

  await assertNoOpenWithdrawal(evaluator.id, 'change your wallet');
  try {
    await prisma.tonWallet.upsert({
      where: { userId: evaluator.id },
      create: { userId: evaluator.id, address },
      update: { address, createdAt: new Date() },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw errors.conflict('WALLET_TAKEN', 'This wallet is already linked to another RealCheck account.');
    }
    throw error;
  }
  return { address: friendlyAddress(address) };
}

export async function unlinkWallet(evaluator: Evaluator) {
  await assertNoOpenWithdrawal(evaluator.id, 'remove your wallet');
  await prisma.tonWallet.deleteMany({ where: { userId: evaluator.id } });
}

export async function requestWithdrawal(evaluator: Evaluator, amountCents: number): Promise<WithdrawalSummary> {
  if (isSuspended(evaluator)) throw errors.forbidden('Withdrawals are paused for this account.');
  if (amountCents < MIN_WITHDRAWAL_CENTS) throw errors.validation('That amount is below the minimum withdrawal.');
  await settleRewards(evaluator);

  const withdrawal = await prisma.$transaction(async (tx) => {
    // Lock this user's row so concurrent requests are handled one at a time.
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${evaluator.id} FOR UPDATE`;

    const wallet = await tx.tonWallet.findUnique({ where: { userId: evaluator.id } });
    if (!wallet) throw errors.conflict('NO_WALLET', 'Connect a TON wallet first.');
    const open = await tx.withdrawal.count({ where: { userId: evaluator.id, status: { in: OPEN_WITHDRAWAL_STATUSES } } });
    if (open > 0) throw errors.conflict('WITHDRAWAL_OPEN', 'You already have a withdrawal in progress.');

    const held = await tx.user.updateMany({
      where: { id: evaluator.id, balanceCents: { gte: amountCents } },
      data: { balanceCents: { decrement: amountCents } },
    });
    if (held.count === 0) throw errors.conflict('INSUFFICIENT_FUNDS', 'That is more than your available balance.');

    const created = await tx.withdrawal.create({
      data: { userId: evaluator.id, amountCents, address: wallet.address, asset: PAYOUT_ASSET },
    });
    await tx.ledgerEntry.create({
      data: { userId: evaluator.id, type: 'WITHDRAWAL', amountCents: -amountCents, withdrawalId: created.id },
    });
    return created;
  });

  return toSummary(withdrawal);
}
