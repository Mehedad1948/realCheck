import { Prisma, type PrismaClient } from '@prisma/client';

// Every balance change goes through here, inside the caller's transaction, so each
// ledger entry and the balance column it affects always move together.
//
// Buckets: a user's balanceCents is the sum of their AVAILABLE entries and their
// pendingCents the sum of their PENDING entries. Rewards are earned into PENDING and
// released to AVAILABLE once their hold period ends.
//
// This module deliberately avoids `server-only` so the payout CLI can share it.

export type Db = Prisma.TransactionClient | PrismaClient;

type SettledReward = { id: string; amountCents: number; datasetId: string | null };

/**
 * Marks this user's unsettled rewards as settled and returns them. Done with one
 * UPDATE ... RETURNING, so two concurrent settlements can never take the same reward.
 */
function takeRewards(db: Db, userId: string, now: Date, { maturedOnly }: { maturedOnly: boolean }) {
  return db.$queryRaw<SettledReward[]>`
    UPDATE "LedgerEntry"
    SET "settledAt" = ${now}
    WHERE "userId" = ${userId}
      AND type = 'TASK_REWARD'
      AND bucket = 'PENDING'
      AND "settledAt" IS NULL
      ${maturedOnly ? Prisma.sql`AND "availableAt" <= ${now}` : Prisma.empty}
    RETURNING id, "amountCents", "datasetId"`;
}

const sum = (rows: { amountCents: number }[]) => rows.reduce((total, row) => total + row.amountCents, 0);

/** Moves rewards whose hold period has ended from pending to available. Returns the amount released. */
export async function releaseMaturedRewards(db: Db, userId: string, now = new Date()) {
  const rewards = await takeRewards(db, userId, now, { maturedOnly: true });
  const total = sum(rewards);
  if (total === 0) return 0;

  await db.ledgerEntry.createMany({
    data: [
      { userId, type: 'REWARD_RELEASE', bucket: 'PENDING', amountCents: -total, createdAt: now },
      { userId, type: 'REWARD_RELEASE', bucket: 'AVAILABLE', amountCents: total, createdAt: now },
    ],
  });
  await db.user.update({
    where: { id: userId },
    data: { pendingCents: { decrement: total }, balanceCents: { increment: total } },
  });
  return total;
}

/**
 * Takes back every reward a suspended evaluator has not been released yet, and refunds
 * each dataset owner what they paid for those answers. The platform keeps its fee.
 * Returns the amount clawed back.
 */
export async function clawbackPendingRewards(db: Db, userId: string, now = new Date()) {
  const rewards = await takeRewards(db, userId, now, { maturedOnly: false });
  const total = sum(rewards);
  if (total === 0) return 0;

  const byDataset = new Map<string | null, number>();
  for (const reward of rewards) byDataset.set(reward.datasetId, (byDataset.get(reward.datasetId) ?? 0) + reward.amountCents);

  const datasetIds = [...byDataset.keys()].filter((id): id is string => id !== null);
  const datasets = await db.dataset.findMany({ where: { id: { in: datasetIds } }, select: { id: true, ownerId: true } });
  const owners = new Map(datasets.map((dataset) => [dataset.id, dataset.ownerId]));

  const entries: Prisma.LedgerEntryCreateManyInput[] = [];
  const refunds = new Map<string, number>();
  for (const [datasetId, amount] of byDataset) {
    entries.push({ userId, type: 'CLAWBACK', bucket: 'PENDING', amountCents: -amount, datasetId, createdAt: now });
    // Rewards from deleted datasets have no one to refund.
    const ownerId = datasetId ? owners.get(datasetId) : undefined;
    if (!ownerId) continue;
    entries.push({ userId: ownerId, type: 'REWARD_REFUND', amountCents: amount, datasetId, createdAt: now, note: 'Answers from a suspended evaluator' });
    refunds.set(ownerId, (refunds.get(ownerId) ?? 0) + amount);
  }

  await db.ledgerEntry.createMany({ data: entries });
  await db.user.update({ where: { id: userId }, data: { pendingCents: { decrement: total } } });
  for (const [ownerId, amount] of refunds) {
    await db.user.update({ where: { id: ownerId }, data: { balanceCents: { increment: amount } } });
  }
  return total;
}

/** Credits a held withdrawal back to the evaluator's available balance. */
export async function refundWithdrawal(db: Db, withdrawal: { id: string; userId: string; amountCents: number }, note: string) {
  await db.ledgerEntry.create({
    data: {
      userId: withdrawal.userId,
      type: 'WITHDRAWAL_REVERSAL',
      amountCents: withdrawal.amountCents,
      withdrawalId: withdrawal.id,
      note,
    },
  });
  await db.user.update({ where: { id: withdrawal.userId }, data: { balanceCents: { increment: withdrawal.amountCents } } });
}
