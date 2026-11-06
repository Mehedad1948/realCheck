import 'server-only';
import { Prisma } from '@prisma/client';
import type { DatasetHistory, HistoryAnswer, HistoryDataset, OpenTaskCounts } from '@/lib/api/types';
import type { Evaluator } from '@/server/auth/tma';
import { prisma } from '@/server/db';
import { errors } from '@/server/errors';

// The evaluator's own past work. Accuracy here is agreement with the final consensus
// on resolved tasks. Golden tasks stay "pending" so they are never revealed as special.

const HISTORY_DATASETS = 50;
const HISTORY_ANSWERS = 100;

/** Unanswered active tasks per open dataset, for this evaluator. */
export async function getOpenTaskCounts(evaluator: Evaluator): Promise<OpenTaskCounts> {
  // Only regular tasks with a free slot: golden tasks never complete and would keep every dataset looking unfinished.
  const rows = await prisma.task.groupBy({
    by: ['datasetId'],
    where: {
      status: 'ACTIVE',
      isValidation: false,
      collectedVotes: { lt: prisma.task.fields.targetVotes },
      dataset: { status: 'ACTIVE' },
      votes: { none: { userId: evaluator.id } },
    },
    _count: { _all: true },
  });
  return { remaining: Object.fromEntries(rows.map((row) => [row.datasetId, row._count._all])) };
}

type SummaryRow = Omit<HistoryDataset, 'accuracy' | 'lastAnsweredAt' | 'id'> & {
  datasetId: string;
  scored: number;
  matched: number;
  lastAnsweredAt: Date;
};

function summaries(userId: string, datasetId?: string) {
  return prisma.$queryRaw<SummaryRow[]>`
    SELECT d.id AS "datasetId", d.title, d."dataType", d.status::text AS status,
      COUNT(*)::int AS answers,
      COALESCE(SUM(v."rewardCents"), 0)::int AS "earnedCents",
      (COUNT(*) FILTER (WHERE NOT t."isValidation" AND t.status = 'COMPLETED' AND t."consensusLabel" IS NOT NULL))::int AS scored,
      (COUNT(*) FILTER (WHERE NOT t."isValidation" AND t.status = 'COMPLETED' AND t."consensusLabel" = v.selection))::int AS matched,
      (COUNT(*) FILTER (WHERE t.status = 'ACTIVE'))::int AS pending,
      MAX(v."createdAt") AS "lastAnsweredAt"
    FROM "Vote" v
    JOIN "Task" t ON t.id = v."taskId"
    JOIN "Dataset" d ON d.id = t."datasetId"
    WHERE v."userId" = ${userId} ${datasetId ? Prisma.sql`AND d.id = ${datasetId}` : Prisma.empty}
    GROUP BY d.id
    ORDER BY "lastAnsweredAt" DESC
    LIMIT ${HISTORY_DATASETS}`;
}

function toHistoryDataset({ datasetId, scored, matched, lastAnsweredAt, ...row }: SummaryRow): HistoryDataset {
  return {
    ...row,
    id: datasetId,
    accuracy: scored > 0 ? matched / scored : null,
    lastAnsweredAt: lastAnsweredAt.toISOString(),
  };
}

export async function getEvaluatorHistory(evaluator: Evaluator): Promise<HistoryDataset[]> {
  return (await summaries(evaluator.id)).map(toHistoryDataset);
}

export async function getEvaluatorDatasetHistory(evaluator: Evaluator, datasetId: string): Promise<DatasetHistory> {
  const [[summary], dataset, remaining, votes] = await Promise.all([
    summaries(evaluator.id, datasetId),
    prisma.dataset.findUnique({ where: { id: datasetId }, select: { question: true } }),
    prisma.task.count({
      where: {
        datasetId,
        status: 'ACTIVE',
        isValidation: false,
        collectedVotes: { lt: prisma.task.fields.targetVotes },
        dataset: { status: 'ACTIVE' },
        votes: { none: { userId: evaluator.id } },
      },
    }),
    prisma.vote.findMany({
      where: { userId: evaluator.id, task: { datasetId } },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_ANSWERS,
      select: {
        selection: true,
        createdAt: true,
        task: {
          select: { id: true, content: true, imageUrls: true, isValidation: true, status: true, consensusLabel: true },
        },
      },
    }),
  ]);
  if (!summary || !dataset) throw errors.notFound('No answers in this dataset yet.');

  const answers = votes.map(({ selection, createdAt, task }): HistoryAnswer => {
    // Disputed tasks have no label, so they read like a tie.
    const resolved = !task.isValidation && task.status !== 'ACTIVE';
    const outcome = !resolved
      ? 'pending'
      : task.consensusLabel === null
        ? 'tie'
        : task.consensusLabel === selection
          ? 'match'
          : 'mismatch';
    return {
      taskId: task.id,
      content: task.content,
      imageUrl: task.imageUrls[0] ?? null,
      selection,
      outcome,
      consensusLabel: outcome === 'mismatch' ? task.consensusLabel : null,
      answeredAt: createdAt.toISOString(),
    };
  });

  return { dataset: { ...toHistoryDataset(summary), question: dataset.question, remaining }, answers };
}
