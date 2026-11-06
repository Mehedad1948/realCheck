'use server';

import { z } from 'zod';
import { ACTIVATION_FUNDING_TASKS, MAX_REQUIRED_VOTES } from '@/lib/constants';
import { chargePerAnswerCents, formatMoney } from '@/lib/money';
import {
  createDatasetSchema,
  datasetStatusSchema,
  id,
  imageUrlSchema,
  updateDatasetSchema,
  uploadTasksSchema,
} from '@/lib/validation';
import { expireDataset, expireOwnerDatasets } from '@/server/cache-invalidation';
import { prisma } from '@/server/db';
import { errors } from '@/server/errors';
import { clientAction } from './client-action';

async function findOwnedDataset(ownerId: string, datasetId: string) {
  const dataset = await prisma.dataset.findFirst({
    where: { id: datasetId, ownerId },
    select: {
      id: true,
      ownerId: true,
      status: true,
      dataType: true,
      options: true,
      rewardCents: true,
      requiredVotes: true,
      maxVotes: true,
    },
  });
  if (!dataset) throw errors.notFound('Dataset not found.');
  return dataset;
}

/** By default, items whose answers disagree can collect two extra answers. */
const defaultMaxVotes = (requiredVotes: number) => Math.min(requiredVotes + 2, MAX_REQUIRED_VOTES);

export const createDatasetAction = clientAction(createDatasetSchema, async (input, viewer) => {
  const dataset = await prisma.dataset.create({
    // Starts paused: it has no tasks yet, and activation checks the budget.
    data: { ...input, maxVotes: defaultMaxVotes(input.requiredVotes), ownerId: viewer.id, status: 'PAUSED' },
    select: { id: true },
  });
  expireOwnerDatasets(viewer.id, 'immediate');
  return { datasetId: dataset.id };
});

export const updateDatasetAction = clientAction(
  z.object({ datasetId: id, change: updateDatasetSchema }),
  async ({ datasetId, change }, viewer) => {
    const dataset = await findOwnedDataset(viewer.id, datasetId);

    if (change.field === 'requiredVotes') {
      const votes = await prisma.vote.count({ where: { task: { datasetId } } });
      if (votes > 0) {
        throw errors.conflict('LOCKED', 'Required votes can’t change after labeling has started.');
      }
      await prisma.$transaction([
        prisma.dataset.update({
          where: { id: datasetId },
          data: { requiredVotes: change.value, maxVotes: Math.max(dataset.maxVotes, change.value) },
        }),
        prisma.task.updateMany({ where: { datasetId }, data: { targetVotes: change.value } }),
      ]);
      expireDataset({ datasetId, ownerId: dataset.ownerId }, 'immediate');
      return;
    }

    if (change.field === 'maxVotes') {
      if (change.value < dataset.requiredVotes) {
        throw errors.validation(`Max answers can’t be below answers per item (${dataset.requiredVotes}).`);
      }
      // Lowering the cap could strand items that already escalated past it.
      if (change.value < dataset.maxVotes && (await prisma.vote.count({ where: { task: { datasetId } } })) > 0) {
        throw errors.conflict('LOCKED', 'Max answers can only go up after labeling has started.');
      }
    }

    await prisma.dataset.update({ where: { id: datasetId }, data: { [change.field]: change.value } });
    expireDataset({ datasetId, ownerId: dataset.ownerId }, 'immediate');
  },
);

export const setDatasetStatusAction = clientAction(
  z.object({ datasetId: id, status: datasetStatusSchema }),
  async ({ datasetId, status }, viewer) => {
    const dataset = await findOwnedDataset(viewer.id, datasetId);
    if (dataset.status === 'COMPLETED') {
      throw errors.conflict('COMPLETED', 'This dataset is complete. Upload more data to reopen it.');
    }

    if (status === 'ACTIVE') {
      const remaining = await prisma.task.count({ where: { datasetId, status: 'ACTIVE', isValidation: false } });
      if (remaining === 0) throw errors.conflict('NO_TASKS', 'Upload some data before activating this dataset.');

      // The owner must be able to fund the next batch of tasks up front.
      const tasksToFund = Math.min(remaining, ACTIVATION_FUNDING_TASKS);
      const requiredCents = tasksToFund * dataset.requiredVotes * chargePerAnswerCents(dataset.rewardCents);
      if (viewer.balanceCents < requiredCents) {
        throw errors.conflict(
          'INSUFFICIENT_FUNDS',
          `Add funds to activate: the next ${tasksToFund} tasks need ${formatMoney(requiredCents)} (balance ${formatMoney(viewer.balanceCents)}).`,
        );
      }
    }

    await prisma.dataset.update({ where: { id: datasetId }, data: { status } });
    expireDataset({ datasetId, ownerId: dataset.ownerId }, 'immediate');
    return { status };
  },
);

export const uploadTasksAction = clientAction(uploadTasksSchema, async ({ datasetId, rows }, viewer) => {
  const dataset = await findOwnedDataset(viewer.id, datasetId);

  const problems: string[] = [];
  const data = rows.map((row, index) => {
    if (dataset.dataType === 'IMAGE' && !imageUrlSchema.safeParse(row.content).success) {
      problems.push(`Row ${index + 1}: not a valid http(s) image URL.`);
    }
    if (row.correctAnswer !== undefined && !dataset.options.includes(row.correctAnswer)) {
      problems.push(`Row ${index + 1}: "${row.correctAnswer}" is not one of the answer options.`);
    }
    return {
      datasetId,
      content: row.content,
      imageUrls: dataset.dataType === 'IMAGE' ? [row.content] : [],
      targetVotes: dataset.requiredVotes,
      isValidation: row.correctAnswer !== undefined,
      correctAnswer: row.correctAnswer ?? null,
    };
  });
  if (problems.length > 0) {
    throw errors.validation(problems.slice(0, 3).join(' ') + (problems.length > 3 ? ` (+${problems.length - 3} more)` : ''));
  }

  const { count } = await prisma.task.createMany({ data });

  // New work reopens a finished dataset (paused, so the owner re-activates it deliberately).
  if (dataset.status === 'COMPLETED' && data.some((row) => !row.isValidation)) {
    await prisma.dataset.update({ where: { id: datasetId }, data: { status: 'PAUSED' } });
  }

  expireDataset({ datasetId, ownerId: dataset.ownerId }, 'immediate');
  return { count, gold: data.filter((row) => row.isValidation).length };
});

export const clearTasksAction = clientAction(z.object({ datasetId: id }), async ({ datasetId }, viewer) => {
  const dataset = await findOwnedDataset(viewer.id, datasetId);
  if (dataset.status === 'ACTIVE') throw errors.conflict('ACTIVE', 'Pause the dataset before clearing its tasks.');

  const { count } = await prisma.task.deleteMany({ where: { datasetId } });
  await prisma.dataset.update({ where: { id: datasetId }, data: { status: 'PAUSED' } });
  expireDataset({ datasetId, ownerId: dataset.ownerId }, 'immediate');
  return { count };
});
