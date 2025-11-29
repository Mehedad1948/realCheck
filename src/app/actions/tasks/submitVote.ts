'use server';

import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function submitVote(taskId: string, answer: string) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return {
        success: false,
        message: 'Unauthorized. Please open in Telegram.',
      };
    }
    // Find or Create the Worker

    const userId = user.id;

    // ============================================================
    // 2. DATABASE TRANSACTION
    // ============================================================
    // We use a transaction to ensure Money and Data stay in sync.
    const result = await prisma.$transaction(async (tx) => {
      // A. Fetch Task and Dataset Info (we need the Reward amount)
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: { dataset: true }, // Include parent to get reward price
      });

      if (!task) {
        throw new Error('Task not found or expired.');
      }

      // B. Check for Duplicate Vote
      const existingVote = await tx.vote.findUnique({
        where: {
          userId_taskId: {
            userId: userId,
            taskId: taskId,
          },
        },
      });

      if (existingVote) {
        throw new Error('You have already completed this task.');
      }

      // C. Determine Validation Logic (Golden Data)
      let isCorrect: boolean | null = null;
      let rewardAmount = 0;
      let reputationChange = 0;

      if (task.isValidation) {
        // It's a test question! Check against the correct answer.
        isCorrect = answer === task.correctAnswer;

        if (isCorrect) {
          rewardAmount = task.dataset.reward; // Full reward
          reputationChange = 1.0; // Boost reputation
        } else {
          rewardAmount = 0; // No reward for wrong answers
          reputationChange = -2.0; // Heavy penalty for failing validation
        }
      } else {
        // Regular Task: We pay them immediately (or you could queue it for consensus)
        // For this MVP, we pay immediately upon submission.
        rewardAmount = task.dataset.reward;
        isCorrect = null; // We don't know if it's correct yet (needs consensus)
      }

      // D. Create the Vote Record
      const newVote = await tx.vote.create({
        data: {
          userId: userId,
          taskId: taskId,
          selection: answer,
          isCorrect: isCorrect,
        },
      });

      // E. Update User Balance & Reputation
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balance: { increment: rewardAmount },
          reputation: { increment: reputationChange },
        },
      });

      return { newVote, updatedUser, rewardAmount, isCorrect };
    });

    // ============================================================
    // 3. RETURN RESPONSE
    // ============================================================

    // Optional: Revalidate cache if you are showing the task list on the same page
    // revalidatePath('/worker/tasks');

    return {
      success: true,
      message:
        result.isCorrect === false
          ? 'Incorrect answer. No reward.'
          : 'Task completed!',
      reward: result.rewardAmount,
      newBalance: result.updatedUser.balance,
    };
  } catch (error: any) {
    console.error('[SUBMIT_VOTE_ERROR]', error);
    return {
      success: false,
      message: error.message || 'Failed to submit vote.',
      reward: 0,
    };
  }
}
