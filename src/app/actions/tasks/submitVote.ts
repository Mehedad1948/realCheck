'use server';

import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function submitVote(taskId: string, answer: string) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return {
        success: false,
        message: 'Unauthorized. Please open in Telegram.',
      };
    }

    const userId = user.id;

    // ============================================================
    // DATABASE TRANSACTION
    // ============================================================
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch Task
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: { dataset: true },
      });

      if (!task) {
        throw new Error('Task not found or expired.');
      }

      // 2. Determine New Status & Reward Logic
      let newIsCorrect: boolean | null = null;
      let newReward = 0;
      let newReputation = 0;

      if (task.isValidation) {
        // Validation Logic
        newIsCorrect = (answer === task.correctAnswer);
        if (newIsCorrect) {
            newReward = task.dataset.reward;
            newReputation = 1.0;
        } else {
            newReward = 0;
            newReputation = -2.0; 
        }
      } else {
        // Standard Task Logic
        newReward = task.dataset.reward;
        newIsCorrect = null; 
      }

      // 3. Check for Existing Vote
      const existingVote = await tx.vote.findUnique({
        where: {
          userId_taskId: { userId, taskId },
        },
      });

      let balanceDelta = 0;
      let reputationDelta = 0;
      let finalVote;

      if (existingVote) {
        // ========================================================
        // UPDATE EXISTING VOTE
        // ========================================================
        
        // Calculate what they earned previously
        let oldReward = 0;
        let oldReputation = 0;

        if (task.isValidation) {
            // If they were previously correct, they had earned reward/rep
            if (existingVote.isCorrect) {
                oldReward = task.dataset.reward;
                oldReputation = 1.0;
            } else {
                // If they were previously wrong, they earned 0 reward and -2 rep
                oldReward = 0;
                oldReputation = -2.0;
            }
        } else {
            // Standard task: They were already paid once.
            // We do NOT pay them again for updating, nor do we deduct.
            // So we treat "oldReward" as equal to "newReward" so Delta is 0.
            oldReward = task.dataset.reward;
            oldReputation = 0; // Assuming standard tasks don't auto-give reputation yet
        }

        // Calculate the Difference (Delta)
        // Example: Changed from Wrong (0) to Right (10) -> Delta = +10
        // Example: Changed from Right (10) to Wrong (0) -> Delta = -10
        balanceDelta = newReward - oldReward;
        reputationDelta = newReputation - oldReputation;

        finalVote = await tx.vote.update({
            where: { id: existingVote.id },
            data: {
                selection: answer,
                isCorrect: newIsCorrect,
            }
        });

      } else {
        // ========================================================
        // CREATE NEW VOTE
        // ========================================================
        balanceDelta = newReward;
        reputationDelta = newReputation;

        finalVote = await tx.vote.create({
          data: {
            userId: userId,
            taskId: taskId,
            selection: answer,
            isCorrect: newIsCorrect,
          },
        });
      }

      // 4. Update User Balance & Reputation
      // We only update if there is an actual change (optimization)
      if (balanceDelta !== 0 || reputationDelta !== 0) {
          await tx.user.update({
            where: { id: userId },
            data: {
              balance: { increment: balanceDelta },
              reputation: { increment: reputationDelta },
            },
          });
      }

      // We need to return the *Total* new balance, so we fetch the user state or calculate it
      // For speed, let's just return the increment applied this specific time, 
      // or fetch the user again if UI needs absolute total.
      const updatedUser = await tx.user.findUnique({ where: { id: userId }});

      return { 
          vote: finalVote, 
          newBalance: updatedUser?.balance || 0,
          rewardReceived: newReward, // What this specific answer is worth
          isCorrect: newIsCorrect 
      };
    });

    return {
      success: true,
      message: result.isCorrect === false ? 'Answer updated (Incorrect)' : 'Answer saved!',
      reward: result.rewardReceived,
      newBalance: result.newBalance,
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
