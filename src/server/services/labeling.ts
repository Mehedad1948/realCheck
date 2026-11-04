import 'server-only';
import {
  GOLD_CORRECT_REPUTATION,
  GOLD_WRONG_REPUTATION,
  MIN_REPUTATION,
  TASK_BATCH_SIZE,
  TASK_CANDIDATE_POOL,
} from '@/lib/constants';
import type { EvaluatorProfile, TaskBatch, VoteResult } from '@/lib/api/types';
import type { Evaluator } from '@/server/auth/tma';
import { expireDataset } from '@/server/cache-invalidation';
import { prisma } from '@/server/db';
import { errors, isUniqueViolation } from '@/server/errors';
import { computeConsensus } from './consensus';

// The evaluator side of the marketplace: serving tasks and accepting votes.

export async function getEvaluatorProfile(evaluator: Evaluator): Promise<EvaluatorProfile> {
  const [user, tasksDone, gold] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: evaluator.id },
      select: { id: true, firstName: true, username: true, photoUrl: true, balanceCents: true, reputation: true },
    }),
    prisma.vote.count({ where: { userId: evaluator.id } }),
    prisma.vote.groupBy({
      by: ['isCorrect'],
      where: { userId: evaluator.id, isCorrect: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const goldTotal = gold.reduce((sum, row) => sum + row._count._all, 0);
  const goldCorrect = gold.find((row) => row.isCorrect)?._count._all ?? 0;

  return {
    ...user,
    tasksDone,
    accuracy: goldTotal > 0 ? goldCorrect / goldTotal : null,
    canLabel: user.reputation >= MIN_REPUTATION,
  };
}

function shuffle<T>(items: T[]) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

const lowReputation = () =>
  errors.forbidden('Your accuracy on check questions is too low to receive new tasks.');
const datasetUnavailable = () =>
  errors.conflict('DATASET_UNAVAILABLE', 'This dataset is not accepting answers right now.');

export async function getTaskBatch(evaluator: Evaluator, datasetId: string): Promise<TaskBatch> {
  if (evaluator.reputation < MIN_REPUTATION) throw lowReputation();

  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    select: { status: true, dataType: true, rewardCents: true, owner: { select: { balanceCents: true } } },
  });
  if (!dataset) throw errors.notFound('Dataset not found.');
  if (dataset.status !== 'ACTIVE') throw datasetUnavailable();

  // Don't hand out more work than the owner can currently pay for.
  const affordable = Math.floor(dataset.owner.balanceCents / dataset.rewardCents);
  if (affordable < 1) return { datasetId, tasks: [] };

  const candidates = await prisma.task.findMany({
    where: { datasetId, status: 'ACTIVE', votes: { none: { userId: evaluator.id } } },
    orderBy: { collectedVotes: 'asc' },
    take: TASK_CANDIDATE_POOL,
    select: { id: true, content: true, imageUrls: true },
  });

  const tasks = shuffle(candidates)
    .slice(0, Math.min(TASK_BATCH_SIZE, affordable))
    .map((task) => ({
      id: task.id,
      content: task.content,
      imageUrls: dataset.dataType === 'IMAGE' && task.imageUrls.length === 0 ? [task.content] : task.imageUrls,
    }));

  return { datasetId, tasks };
}

class OwnerOutOfFunds extends Error {}

export async function submitVote(evaluator: Evaluator, taskId: string, selection: string): Promise<VoteResult> {
  if (evaluator.reputation < MIN_REPUTATION) throw lowReputation();

  const [task, existingVote] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      select: { datasetId: true, dataset: { select: { ownerId: true } } },
    }),
    prisma.vote.findUnique({ where: { userId_taskId: { userId: evaluator.id, taskId } }, select: { id: true } }),
  ]);
  if (!task) throw errors.notFound('Task not found.');
  // Fast path for the common retry case. The unique index below still guards races.
  if (existingVote) throw errors.conflict('ALREADY_ANSWERED', 'You already answered this task.');
  const scope = { datasetId: task.datasetId, ownerId: task.dataset.ownerId };

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      // Re-read inside the transaction so the checks below see current state.
      const current = await tx.task.findUniqueOrThrow({
        where: { id: taskId },
        select: {
          status: true,
          isValidation: true,
          correctAnswer: true,
          dataset: { select: { status: true, options: true, rewardCents: true, requiredVotes: true } },
        },
      });
      const { dataset } = current;
      if (dataset.status !== 'ACTIVE') throw datasetUnavailable();
      if (!dataset.options.includes(selection)) throw errors.validation('That answer is not one of the options.');

      // Claim a vote slot. The conditional update is atomic, so concurrent voters
      // can never push a task past its required votes. Golden tasks never fill up.
      const claimed = await tx.task.updateMany({
        where: {
          id: taskId,
          status: 'ACTIVE',
          ...(current.isValidation ? {} : { collectedVotes: { lt: dataset.requiredVotes } }),
        },
        data: { collectedVotes: { increment: 1 } },
      });
      if (claimed.count === 0) throw errors.conflict('TASK_CLOSED', 'This task already has enough answers.');

      const isCorrect = current.isValidation ? selection === current.correctAnswer : null;
      const rewardCents = isCorrect === false ? 0 : dataset.rewardCents;
      const reputationDelta =
        isCorrect === null ? 0 : isCorrect ? GOLD_CORRECT_REPUTATION : GOLD_WRONG_REPUTATION;

      // Unique on (userId, taskId): a second answer fails with P2002.
      const vote = await tx.vote.create({
        data: { userId: evaluator.id, taskId, selection, isCorrect, rewardCents },
        select: { id: true },
      });

      if (rewardCents > 0) {
        // Debit the owner only if they can afford it. Never goes negative.
        const charged = await tx.user.updateMany({
          where: { id: scope.ownerId, balanceCents: { gte: rewardCents } },
          data: { balanceCents: { decrement: rewardCents } },
        });
        if (charged.count === 0) throw new OwnerOutOfFunds();

        await tx.ledgerEntry.createMany({
          data: [
            { userId: scope.ownerId, type: 'TASK_CHARGE', amountCents: -rewardCents, datasetId: scope.datasetId, voteId: vote.id },
            { userId: evaluator.id, type: 'TASK_REWARD', amountCents: rewardCents, datasetId: scope.datasetId, voteId: vote.id },
          ],
        });
      }

      const worker = await tx.user.update({
        where: { id: evaluator.id },
        data: {
          balanceCents: { increment: rewardCents },
          reputation: { increment: reputationDelta },
          lastSeenAt: new Date(),
        },
        select: { balanceCents: true },
      });

      let datasetChanged = false;
      if (!current.isValidation) {
        const { collectedVotes } = await tx.task.findUniqueOrThrow({
          where: { id: taskId },
          select: { collectedVotes: true },
        });
        if (collectedVotes >= dataset.requiredVotes) {
          const tally = await tx.vote.groupBy({ by: ['selection'], where: { taskId }, _count: { _all: true } });
          const consensus = computeConsensus(tally.map((row) => ({ selection: row.selection, votes: row._count._all })));
          await tx.task.update({
            where: { id: taskId },
            data: {
              status: 'COMPLETED',
              consensusLabel: consensus.label,
              agreement: consensus.agreement,
              completedAt: new Date(),
            },
          });
          datasetChanged = true;

          const remaining = await tx.task.count({
            where: { datasetId: scope.datasetId, status: 'ACTIVE', isValidation: false },
          });
          if (remaining === 0) {
            await tx.dataset.update({ where: { id: scope.datasetId }, data: { status: 'COMPLETED' } });
          }
        }
      }

      return { result: { taskId, rewardCents, balanceCents: worker.balanceCents }, datasetChanged };
    });

    // Progress shown to the owner and the public list only change when a task completes,
    // not on every vote, which keeps cache churn low under heavy labeling.
    if (outcome.datasetChanged) expireDataset(scope, 'background');
    return outcome.result;
  } catch (error) {
    if (isUniqueViolation(error)) throw errors.conflict('ALREADY_ANSWERED', 'You already answered this task.');
    if (error instanceof OwnerOutOfFunds) {
      await prisma.dataset.updateMany({
        where: { id: scope.datasetId, status: 'ACTIVE' },
        data: { status: 'PAUSED' },
      });
      expireDataset(scope, 'background');
      throw errors.conflict('DATASET_UNAVAILABLE', 'This dataset just ran out of budget. Try another one.');
    }
    throw error;
  }
}
