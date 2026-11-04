import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import type { OpenDataset, PublicDataset } from '@/lib/api/types';
import { tags } from '@/server/cache-tags';
import { prisma } from '@/server/db';

// Public, viewer-independent reads. Safe to cache across all users and to
// include in prerendered shells. Writes invalidate them through `tags`.

export async function getOpenDatasets(): Promise<OpenDataset[]> {
  'use cache';
  cacheTag(tags.openDatasets);
  cacheLife('minutes');

  const rows = await prisma.dataset.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      title: true,
      description: true,
      dataType: true,
      rewardCents: true,
      _count: { select: { tasks: { where: { status: 'ACTIVE' } } } },
    },
  });

  return rows
    .filter((row) => row._count.tasks > 0)
    .map(({ _count, ...row }) => ({ ...row, openTasks: _count.tasks }));
}

export async function getPublicDataset(datasetId: string): Promise<PublicDataset | null> {
  'use cache';
  cacheTag(tags.dataset(datasetId));
  cacheLife('hours');

  return prisma.dataset.findUnique({
    where: { id: datasetId },
    select: {
      id: true,
      title: true,
      description: true,
      question: true,
      options: true,
      dataType: true,
      rewardCents: true,
      status: true,
    },
  });
}

export async function getPlatformStats() {
  'use cache';
  cacheTag(tags.platformStats);
  cacheLife('hours');

  const [activeDatasets, labels, evaluators] = await Promise.all([
    prisma.dataset.count({ where: { status: 'ACTIVE' } }),
    prisma.vote.count(),
    prisma.user.count({ where: { role: 'EVALUATOR' } }),
  ]);
  return { activeDatasets, labels, evaluators };
}
