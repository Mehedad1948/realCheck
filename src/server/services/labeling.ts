import 'server-only';
import {
  GOLD_MAX_EXPOSURES,
  TASK_BATCH_SIZE,
  TASK_CANDIDATE_POOL,
  TASK_LEASE_MS,
  TRUST_WINDOW,
} from '@/lib/constants';
import type { Earnings, EvaluatorProfile, TaskBatch, VoteResult } from '@/lib/api/types';
import type { Evaluator } from '@/server/auth/tma';
import { expireDataset } from '@/server/cache-invalidation';
import { prisma } from '@/server/db';
import { errors, isUniqueViolation } from '@/server/errors';
import { clawbackPendingRewards } from '@/server/ledger';
import { chargePerAnswerCents, platformFeeCents } from '@/lib/money';
import { resolveTask } from './consensus';
import { settleRewards } from './payouts';
import { computeTrust, goldRate, isSuspended, rewardHoldDays, sampleGoldCount, toReputation } from './trust';

// The evaluator side of the marketplace: serving tasks and accepting votes.

export async function getEvaluatorProfile(evaluator: Evaluator): Promise<EvaluatorProfile> {
  await settleRewards(evaluator);
  const [user, tasksDone, gold] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: evaluator.id },
      select: {
        id: true,
        firstName: true,
        username: true,
        photoUrl: true,
        balanceCents: true,
        pendingCents: true,
        reputation: true,
      },
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
    canLabel: !isSuspended(evaluator),
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Ledger entries an evaluator sees in their activity list. Releases are bookkeeping, not events. */
const ACTIVITY_TYPES = ['TASK_REWARD', 'CLAWBACK', 'WITHDRAWAL', 'WITHDRAWAL_REVERSAL', 'ADJUSTMENT'] as const;

export async function getEvaluatorEarnings(evaluator: Evaluator): Promise<Earnings> {
  const now = Date.now();
  const startOfToday = new Date(now - (now % DAY_MS));
  const weekAgo = new Date(now - 7 * DAY_MS);
  // Earned is what was rewarded minus anything clawed back.
  const earned = { userId: evaluator.id, type: { in: ['TASK_REWARD' as const, 'CLAWBACK' as const] } };

  const [today, week, total, recent] = await Promise.all([
    prisma.ledgerEntry.aggregate({ where: { ...earned, createdAt: { gte: startOfToday } }, _sum: { amountCents: true } }),
    prisma.ledgerEntry.aggregate({ where: { ...earned, createdAt: { gte: weekAgo } }, _sum: { amountCents: true } }),
    prisma.ledgerEntry.aggregate({ where: earned, _sum: { amountCents: true } }),
    prisma.ledgerEntry.findMany({
      where: { userId: evaluator.id, type: { in: [...ACTIVITY_TYPES] } },
      orderBy: { createdAt: 'desc' },
      take: 30,
      select: { id: true, type: true, amountCents: true, createdAt: true, dataset: { select: { title: true } } },
    }),
  ]);

  return {
    todayCents: today._sum.amountCents ?? 0,
    weekCents: week._sum.amountCents ?? 0,
    totalCents: total._sum.amountCents ?? 0,
    recent: recent.map((entry) => ({
      id: entry.id,
      type: entry.type as (typeof ACTIVITY_TYPES)[number],
      amountCents: entry.amountCents,
      datasetTitle: entry.dataset?.title ?? null,
      createdAt: entry.createdAt.toISOString(),
    })),
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

type Candidate = { id: string; content: string; imageUrls: string[] };

/**
 * Regular tasks this evaluator may take: not answered by them, and with a free vote
 * slot once other evaluators' live leases are counted. Fewest votes first, so every
 * item gets covered before any item gets extra votes.
 */
function findOpenTasks(datasetId: string, userId: string, now: Date) {
  return prisma.$queryRaw<Candidate[]>`
    SELECT t.id, t.content, t."imageUrls"
    FROM "Task" t
    WHERE t."datasetId" = ${datasetId}
      AND t.status = 'ACTIVE'
      AND NOT t."isValidation"
      AND NOT EXISTS (SELECT 1 FROM "Vote" v WHERE v."taskId" = t.id AND v."userId" = ${userId})
      AND t."collectedVotes"
        + (SELECT COUNT(*) FROM "TaskAssignment" a WHERE a."taskId" = t.id AND a."expiresAt" > ${now})
        < t."targetVotes"
    ORDER BY t."collectedVotes" ASC, t."createdAt" ASC
    LIMIT ${TASK_CANDIDATE_POOL}`;
}

/** Golden tasks this evaluator hasn't seen, least exposed first. Over-exposed ones are retired. */
function findGoldTasks(datasetId: string, userId: string) {
  return prisma.task.findMany({
    where: {
      datasetId,
      status: 'ACTIVE',
      isValidation: true,
      collectedVotes: { lt: GOLD_MAX_EXPOSURES },
      votes: { none: { userId } },
    },
    orderBy: { collectedVotes: 'asc' },
    take: TASK_CANDIDATE_POOL,
    select: { id: true, content: true, imageUrls: true },
  });
}

export async function getTaskBatch(evaluator: Evaluator, datasetId: string): Promise<TaskBatch> {
  if (isSuspended(evaluator)) throw lowReputation();

  const dataset = await prisma.dataset.findUnique({
    where: { id: datasetId },
    select: { status: true, dataType: true, rewardCents: true, owner: { select: { balanceCents: true } } },
  });
  if (!dataset) throw errors.notFound('Dataset not found.');
  if (dataset.status !== 'ACTIVE') throw datasetUnavailable();

  // Don't hand out more work than the owner can currently pay for.
  const affordable = Math.floor(dataset.owner.balanceCents / chargePerAnswerCents(dataset.rewardCents));
  if (affordable < 1) return { datasetId, tasks: [] };

  // A new batch replaces the previous one, so release its unanswered slots first.
  await prisma.taskAssignment.deleteMany({ where: { userId: evaluator.id } });

  const now = new Date();
  const [open, gold] = await Promise.all([
    findOpenTasks(datasetId, evaluator.id, now),
    findGoldTasks(datasetId, evaluator.id),
  ]);

  // Golden tasks are mixed in at a rate set by the evaluator's standing. They never
  // fill a batch on their own: with no real work left, there is nothing to check.
  const slots = Math.min(TASK_BATCH_SIZE, affordable);
  const rate = goldRate(evaluator);
  let goldCount = sampleGoldCount(slots, rate);
  const real = shuffle(open).slice(0, slots - goldCount);
  if (real.length === 0) return { datasetId, tasks: [] };
  if (real.length < slots - goldCount) goldCount = sampleGoldCount(real.length, rate);
  const picked = shuffle([...real, ...shuffle(gold).slice(0, goldCount)]);

  await prisma.taskAssignment.createMany({
    data: picked.map((task) => ({
      taskId: task.id,
      userId: evaluator.id,
      createdAt: now,
      expiresAt: new Date(now.getTime() + TASK_LEASE_MS),
    })),
    skipDuplicates: true,
  });

  return {
    datasetId,
    tasks: picked.map((task) => ({
      id: task.id,
      content: task.content,
      imageUrls: dataset.dataType === 'IMAGE' && task.imageUrls.length === 0 ? [task.content] : task.imageUrls,
    })),
  };
}

class OwnerOutOfFunds extends Error {}

export async function submitVote(evaluator: Evaluator, taskId: string, selection: string): Promise<VoteResult> {
  if (isSuspended(evaluator)) throw lowReputation();

  const [task, existingVote, assignment, previousVote] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      select: { datasetId: true, dataset: { select: { ownerId: true } } },
    }),
    prisma.vote.findUnique({ where: { userId_taskId: { userId: evaluator.id, taskId } }, select: { id: true } }),
    prisma.taskAssignment.findUnique({
      where: { taskId_userId: { taskId, userId: evaluator.id } },
      select: { createdAt: true },
    }),
    prisma.vote.findFirst({
      where: { userId: evaluator.id },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ]);
  if (!task) throw errors.notFound('Task not found.');
  // Fast path for the common retry case. The unique index below still guards races.
  if (existingVote) throw errors.conflict('ALREADY_ANSWERED', 'You already answered this task.');
  const scope = { datasetId: task.datasetId, ownerId: task.dataset.ownerId };

  // Tasks in a batch are answered one after another, so time on this task is
  // measured from whichever came last: being served it, or the previous answer.
  const startedAt = Math.max(assignment?.createdAt.getTime() ?? 0, previousVote?.createdAt.getTime() ?? 0);
  const responseMs = startedAt > 0 ? Math.min(Date.now() - startedAt, 2 ** 31 - 1) : null;

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      // Re-read inside the transaction so the checks below see current state.
      const current = await tx.task.findUniqueOrThrow({
        where: { id: taskId },
        select: {
          status: true,
          isValidation: true,
          correctAnswer: true,
          targetVotes: true,
          dataset: { select: { status: true, options: true, rewardCents: true, maxVotes: true } },
        },
      });
      const { dataset } = current;
      if (dataset.status !== 'ACTIVE') throw datasetUnavailable();
      if (!dataset.options.includes(selection)) throw errors.validation('That answer is not one of the options.');

      // Claim a vote slot. The conditional update is atomic, so concurrent voters
      // can never push a task past its target votes. Golden tasks never fill up.
      const claimed = await tx.task.updateMany({
        where: {
          id: taskId,
          status: 'ACTIVE',
          ...(current.isValidation ? {} : { collectedVotes: { lt: current.targetVotes } }),
        },
        data: { collectedVotes: { increment: 1 } },
      });
      if (claimed.count === 0) throw errors.conflict('TASK_CLOSED', 'This task already has enough answers.');

      const isCorrect = current.isValidation ? selection === current.correctAnswer : null;
      const rewardCents = isCorrect === false ? 0 : dataset.rewardCents;
      const feeCents = rewardCents > 0 ? platformFeeCents(rewardCents) : 0;

      // Unique on (userId, taskId): a second answer fails with P2002.
      const vote = await tx.vote.create({
        data: { userId: evaluator.id, taskId, selection, isCorrect, rewardCents, responseMs },
        select: { id: true },
      });
      await tx.taskAssignment.deleteMany({ where: { taskId, userId: evaluator.id } });

      if (rewardCents > 0) {
        // Debit the owner the reward plus the platform fee, only if they can afford it. Never goes negative.
        const chargeCents = rewardCents + feeCents;
        const charged = await tx.user.updateMany({
          where: { id: scope.ownerId, balanceCents: { gte: chargeCents } },
          data: { balanceCents: { decrement: chargeCents } },
        });
        if (charged.count === 0) throw new OwnerOutOfFunds();

        // The reward is held as pending, so it can be clawed back if this evaluator turns out to be cheating.
        const now = new Date();
        const availableAt = new Date(now.getTime() + rewardHoldDays(evaluator) * 24 * 60 * 60 * 1000);
        const charge = { userId: scope.ownerId, datasetId: scope.datasetId, voteId: vote.id };
        await tx.ledgerEntry.createMany({
          data: [
            { ...charge, type: 'TASK_CHARGE', amountCents: -rewardCents },
            ...(feeCents > 0 ? [{ ...charge, type: 'PLATFORM_FEE' as const, amountCents: -feeCents }] : []),
            {
              userId: evaluator.id,
              type: 'TASK_REWARD',
              bucket: 'PENDING',
              amountCents: rewardCents,
              availableAt,
              datasetId: scope.datasetId,
              voteId: vote.id,
            },
          ],
        });
      }

      let standing = {};
      let suspendedNow = false;
      if (isCorrect !== null) {
        const recent = await tx.vote.findMany({
          where: { userId: evaluator.id, isCorrect: { not: null } },
          orderBy: { createdAt: 'desc' },
          take: TRUST_WINDOW,
          select: { isCorrect: true },
        });
        const trust = computeTrust(recent.filter((v) => v.isCorrect).length, recent.length);
        standing = {
          trust,
          reputation: toReputation(trust),
          goldAnswered: { increment: 1 },
          lastGoldCorrect: isCorrect,
        };
        suspendedNow = isSuspended({ trust, goldAnswered: evaluator.goldAnswered + 1, lastGoldCorrect: isCorrect });
      }

      await tx.user.update({
        where: { id: evaluator.id },
        data: { pendingCents: { increment: rewardCents }, lastSeenAt: new Date(), ...standing },
      });
      // Falling below the trust bar takes back everything not yet released and refunds the owners.
      if (suspendedNow) await clawbackPendingRewards(tx, evaluator.id);
      const worker = await tx.user.findUniqueOrThrow({
        where: { id: evaluator.id },
        select: { balanceCents: true, pendingCents: true },
      });

      const datasetChanged = current.isValidation
        ? false
        : await resolveIfFull(tx, taskId, scope.datasetId, dataset, current.targetVotes);

      return {
        result: { taskId, rewardCents, balanceCents: worker.balanceCents, pendingCents: worker.pendingCents },
        datasetChanged,
      };
    });

    // Progress shown to the owner and the public list only change when a task resolves,
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

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/**
 * Once a task has its target votes: resolve it, ask for more votes, or mark it disputed.
 * Votes are weighted by each voter's current trust, so an evaluator who later turns out
 * to be unreliable counts for less on tasks that are still open.
 * Returns whether the owner-visible progress changed.
 */
async function resolveIfFull(
  tx: Tx,
  taskId: string,
  datasetId: string,
  dataset: { options: string[]; maxVotes: number },
  targetVotes: number,
) {
  const { collectedVotes } = await tx.task.findUniqueOrThrow({ where: { id: taskId }, select: { collectedVotes: true } });
  if (collectedVotes < targetVotes) return false;

  const votes = await tx.vote.findMany({ where: { taskId }, select: { selection: true, user: { select: { trust: true } } } });
  const resolution = resolveTask(
    votes.map((vote) => ({ selection: vote.selection, trust: vote.user.trust })),
    dataset.options,
    { targetVotes, maxVotes: dataset.maxVotes },
  );

  if (resolution.kind === 'escalate') {
    await tx.task.update({ where: { id: taskId }, data: { targetVotes: resolution.targetVotes } });
    return false;
  }

  await tx.task.update({
    where: { id: taskId },
    data:
      resolution.kind === 'resolved'
        ? {
            status: 'COMPLETED',
            consensusLabel: resolution.label,
            agreement: resolution.agreement,
            confidence: resolution.confidence,
            completedAt: new Date(),
          }
        : {
            status: 'DISPUTED',
            consensusLabel: null,
            agreement: resolution.agreement,
            confidence: resolution.confidence,
            completedAt: new Date(),
          },
  });

  const remaining = await tx.task.count({ where: { datasetId, status: 'ACTIVE', isValidation: false } });
  if (remaining === 0) await tx.dataset.update({ where: { id: datasetId }, data: { status: 'COMPLETED' } });
  return true;
}
