import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { tags } from '@/server/cache-tags';
import { prisma } from '@/server/db';

// Dashboard reads for one client. `ownerId` must come from the authenticated
// session (see `requireClientPage`), never from the URL. It is part of the cache
// key and every query is scoped by it, so one owner's data can't leak to another.
// Balances are deliberately not cached here: they change with every vote.

export async function getOwnerDatasets(ownerId: string) {
  'use cache';
  cacheTag(tags.ownerDatasets(ownerId));
  cacheLife('minutes');

  const [datasets, completed] = await Promise.all([
    prisma.dataset.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        question: true,
        status: true,
        dataType: true,
        createdAt: true,
        _count: { select: { tasks: { where: { isValidation: false } } } },
      },
    }),
    prisma.task.groupBy({
      by: ['datasetId'],
      where: { dataset: { ownerId }, status: 'COMPLETED', isValidation: false },
      _count: { _all: true },
    }),
  ]);

  const completedByDataset = new Map(completed.map((row) => [row.datasetId, row._count._all]));
  return datasets.map(({ _count, ...dataset }) => ({
    ...dataset,
    totalTasks: _count.tasks,
    completedTasks: completedByDataset.get(dataset.id) ?? 0,
  }));
}

export type OwnerDatasetSummary = Awaited<ReturnType<typeof getOwnerDatasets>>[number];

export async function getOwnerDataset(ownerId: string, datasetId: string) {
  'use cache';
  cacheTag(tags.dataset(datasetId), tags.ownerDatasets(ownerId));
  cacheLife('minutes');

  const dataset = await prisma.dataset.findFirst({
    where: { id: datasetId, ownerId },
    select: {
      id: true,
      title: true,
      description: true,
      question: true,
      options: true,
      status: true,
      dataType: true,
      rewardCents: true,
      requiredVotes: true,
      createdAt: true,
      tasks: {
        take: 5,
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          content: true,
          imageUrls: true,
          collectedVotes: true,
          status: true,
          isValidation: true,
          consensusLabel: true,
          agreement: true,
        },
      },
    },
  });
  if (!dataset) return null;

  const [byStatus, goldTasks, votes] = await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      where: { datasetId, isValidation: false },
      _count: { _all: true },
    }),
    prisma.task.count({ where: { datasetId, isValidation: true } }),
    prisma.vote.count({ where: { task: { datasetId } } }),
  ]);

  const count = (status: 'ACTIVE' | 'COMPLETED') => byStatus.find((row) => row.status === status)?._count._all ?? 0;
  const completedTasks = count('COMPLETED');
  const remainingTasks = count('ACTIVE');

  return {
    ...dataset,
    stats: {
      totalTasks: completedTasks + remainingTasks,
      completedTasks,
      remainingTasks,
      goldTasks,
      votes,
      // Upper bound: every remaining task still needs at most `requiredVotes` paid votes.
      estimatedCostCents: remainingTasks * dataset.requiredVotes * dataset.rewardCents,
    },
  };
}

export type OwnerDataset = NonNullable<Awaited<ReturnType<typeof getOwnerDataset>>>;

export type BillingHistoryItem = {
  id: string;
  kind: 'TOP_UP' | 'CHARGES' | 'ADJUSTMENT';
  date: Date;
  amountCents: number;
  label: string;
  datasetId: string | null;
  answers?: number;
};

/**
 * Billing history. Not cached: it changes with every answer the owner pays for,
 * and must always reconcile with the live balance.
 */
export async function getOwnerBilling(ownerId: string) {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [credits, dailyCharges, byType, lastWeek, perDataset] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { userId: ownerId, type: { in: ['TOP_UP', 'ADJUSTMENT'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { id: true, type: true, amountCents: true, note: true, createdAt: true },
    }),
    // One row per dataset per day instead of one per answer.
    prisma.$queryRaw<{ day: Date; datasetId: string | null; amount: number; answers: number }[]>`
      SELECT date_trunc('day', "createdAt") AS day, "datasetId", SUM("amountCents")::int AS amount, COUNT(*)::int AS answers
      FROM "LedgerEntry"
      WHERE "userId" = ${ownerId} AND type = 'TASK_CHARGE'
      GROUP BY 1, 2
      ORDER BY 1 DESC
      LIMIT 60`,
    prisma.ledgerEntry.groupBy({ by: ['type'], where: { userId: ownerId }, _sum: { amountCents: true } }),
    prisma.ledgerEntry.aggregate({
      where: { userId: ownerId, type: 'TASK_CHARGE', createdAt: { gte: weekAgo } },
      _sum: { amountCents: true },
    }),
    prisma.ledgerEntry.groupBy({
      by: ['datasetId'],
      where: { userId: ownerId, type: 'TASK_CHARGE', datasetId: { not: null } },
      _sum: { amountCents: true },
      _count: { _all: true },
    }),
  ]);

  const datasetIds = [
    ...new Set([...dailyCharges.map((row) => row.datasetId), ...perDataset.map((row) => row.datasetId)].filter((id): id is string => Boolean(id))),
  ];
  const datasets = await prisma.dataset.findMany({ where: { id: { in: datasetIds } }, select: { id: true, title: true } });
  const titles = new Map(datasets.map((d) => [d.id, d.title]));

  const history: BillingHistoryItem[] = [
    ...credits.map((entry) => ({
      id: entry.id,
      kind: entry.type as 'TOP_UP' | 'ADJUSTMENT',
      date: entry.createdAt,
      amountCents: entry.amountCents,
      label: entry.type === 'TOP_UP' ? 'Balance top-up' : (entry.note ?? 'Adjustment'),
      datasetId: null,
    })),
    ...dailyCharges.map((row) => ({
      id: `${row.datasetId}-${row.day.toISOString()}`,
      kind: 'CHARGES' as const,
      date: row.day,
      amountCents: row.amount,
      label: row.datasetId ? (titles.get(row.datasetId) ?? 'Deleted dataset') : 'Deleted dataset',
      datasetId: row.datasetId,
      answers: row.answers,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const sum = (type: string) => byType.find((row) => row.type === type)?._sum.amountCents ?? 0;


  return {
    history,
    totals: {
      fundedCents: sum('TOP_UP') + Math.max(0, sum('ADJUSTMENT')),
      spentCents: -sum('TASK_CHARGE'),
      spentLastWeekCents: -(lastWeek._sum.amountCents ?? 0),
    },
    spendByDataset: perDataset
      .map((row) => ({
        datasetId: row.datasetId!,
        title: titles.get(row.datasetId!) ?? 'Deleted dataset',
        spentCents: -(row._sum.amountCents ?? 0),
        answers: row._count._all,
      }))
      .sort((a, b) => b.spentCents - a.spentCents)
      .slice(0, 6),
  };
}
