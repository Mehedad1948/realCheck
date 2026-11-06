import type { PrismaClient, WithdrawalStatus } from '@prisma/client';
import { refundWithdrawal } from './ledger';

// Review and sending steps of a withdrawal, shared by the Mini App API and the payout CLI.
// Every step is a compare-and-set on status, so a step can't run twice or out of order:
//
//   REQUESTED ─approve─► APPROVED ─send─► SENDING ─► SENT
//       │                   │                 └────► FAILED (funds returned)
//       └──────reject───────┴──► REJECTED (funds returned)
//
// A SENDING withdrawal is never retried automatically: the transfer may already be on
// chain. An operator checks the hot wallet and marks it SENT or FAILED.

export const OPEN_WITHDRAWAL_STATUSES: WithdrawalStatus[] = ['REQUESTED', 'APPROVED', 'SENDING'];

export class WithdrawalStateError extends Error {}

async function transition(
  prisma: PrismaClient,
  id: string,
  from: WithdrawalStatus[],
  to: WithdrawalStatus,
  data: { txHash?: string; note?: string; reviewedAt?: Date; sentAt?: Date } = {},
  refundNote?: string,
) {
  return prisma.$transaction(async (tx) => {
    const moved = await tx.withdrawal.updateMany({ where: { id, status: { in: from } }, data: { status: to, ...data } });
    if (moved.count === 0) {
      const current = await tx.withdrawal.findUnique({ where: { id }, select: { status: true } });
      throw new WithdrawalStateError(
        current ? `Withdrawal ${id} is ${current.status}, expected ${from.join(' or ')}.` : `Withdrawal ${id} not found.`,
      );
    }
    const withdrawal = await tx.withdrawal.findUniqueOrThrow({ where: { id } });
    if (refundNote) await refundWithdrawal(tx, withdrawal, refundNote);
    return withdrawal;
  });
}

export function approveWithdrawal(prisma: PrismaClient, id: string) {
  return transition(prisma, id, ['REQUESTED'], 'APPROVED', { reviewedAt: new Date() });
}

export function rejectWithdrawal(prisma: PrismaClient, id: string, reason: string) {
  return transition(prisma, id, ['REQUESTED', 'APPROVED'], 'REJECTED', { reviewedAt: new Date(), note: reason }, `Withdrawal rejected: ${reason}`);
}

export function markWithdrawalSending(prisma: PrismaClient, id: string) {
  return transition(prisma, id, ['APPROVED'], 'SENDING');
}

export function markWithdrawalSent(prisma: PrismaClient, id: string, txHash: string | undefined) {
  return transition(prisma, id, ['SENDING'], 'SENT', { txHash, sentAt: new Date() });
}

export function markWithdrawalFailed(prisma: PrismaClient, id: string, reason: string) {
  return transition(prisma, id, ['SENDING'], 'FAILED', { note: reason }, `Withdrawal failed: ${reason}`);
}
