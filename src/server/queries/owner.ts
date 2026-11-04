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
