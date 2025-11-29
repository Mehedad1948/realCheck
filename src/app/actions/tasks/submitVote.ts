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
      // 1. Fetch Task with Dataset to get reward AND requiredVotes settings
      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: { dataset: true },
      });

      if (!task) {
        throw new Error('Task not found or expired.');
      }
      
      // If task is already completed (race condition check), you might want to block voting
      // But for now we allow the straggler vote to count to be nice to the user.

      // 2. Determine New Status & Reward Logic
      let newIsCorrect: boolean | null = null;
      let newReward = 0;
      let newReputation = 0;

      if (task.isValidation) {
        // Validation Logic (Golden Tasks)
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
        // Note: We do NOT increment collectedVotes here because 
        // the user is just changing their mind, not adding a new head count.

        let oldReward = 0;
        let oldReputation = 0;

        if (task.isValidation) {
            if (existingVote.isCorrect) {
                oldReward = task.dataset.reward;
                oldReputation = 1.0;
            } else {
                oldReward = 0;
                oldReputation = -2.0;
            }
        } else {
            oldReward = task.dataset.reward;
            oldReputation = 0; 
        }

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

        // --- NEW CONSENSUS LOGIC START ---
        
        // 1. Increment the collected votes counter on the task
        const updatedTask = await tx.task.update({
            where: { id: taskId },
            data: { 
                collectedVotes: { increment: 1 } 
            },
            select: { collectedVotes: true } // Return only what we need
        });

        // 2. Check if we hit the requirement
        const required = task.dataset.requiredVotes || 2; // Default to 2 if null
        
        if (updatedTask.collectedVotes >= required) {
            // Mark task as COMPLETED so it stops showing up for others
            await tx.task.update({
                where: { id: taskId },
                data: { status: 'COMPLETED' }
            });
        }

        // --- NEW CONSENSUS LOGIC END ---
      }

      // 4. Update User Balance & Reputation
      if (balanceDelta !== 0 || reputationDelta !== 0) {
          await tx.user.update({
            where: { id: userId },
            data: {
              balance: { increment: balanceDelta },
              reputation: { increment: reputationDelta },
            },
          });
      }

      const updatedUser = await tx.user.findUnique({ where: { id: userId }});

      return { 
          vote: finalVote, 
          newBalance: updatedUser?.balance || 0,
          rewardReceived: newReward, 
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
