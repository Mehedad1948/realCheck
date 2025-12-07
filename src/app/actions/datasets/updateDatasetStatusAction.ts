'use server';

import { BATCH_SIZE } from '@/constants';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function toggleDatasetStatus(
  datasetId: string,
  newStatus: 'ACTIVE' | 'PAUSED'
) {
  const user = await getSession();


  // 1. Auth Check
  if (!user || user.role !== 'CLIENT') {
    return { success: false, message: 'Unauthorized.' };
  }

  try {
    // 2. Get Dataset Info
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      select: {
        id: true,
        ownerId: true,
        reward: true,
        requiredVotes: true,
        status: true,
      },
    });

    if (!dataset) return { success: false, message: 'Dataset not found.' };
    if (dataset.ownerId !== user.id)
      return { success: false, message: 'Unauthorized.' };

    // 3. LIABILITY CHECK (Only when turning ON)
    if (newStatus === 'ACTIVE') {
      // Get fresh balance
      const userData = await prisma.user.findUnique({
        where: { id: user.id },
        select: { balance: true },
      });

      if (!userData) return { success: false, message: 'User error.' };

      // Count how many tasks are NOT completed
      const incompleteTaskCount = await prisma.task.count({
        where: {
          datasetId: dataset.id,
          status: { not: 'COMPLETED' },
        },
      });

      if (incompleteTaskCount === 0) {
        return { success: false, message: 'All tasks are already completed.' };
      }

      // LOGIC: Determine how many tasks we need to fund right now.
      // If there are 1000 tasks left, we only check funds for 50.
      // If there are 12 tasks left, we check funds for 12.
      const tasksToFund = Math.min(incompleteTaskCount, BATCH_SIZE);

      // Cost Calculation:
      // Cost = (Tasks * Votes_Per_Task) * Cost_Per_Vote
      const costPerTask = dataset.requiredVotes * dataset.reward;
      const requiredBalance = tasksToFund * costPerTask;

      if (userData.balance < requiredBalance) {
        return {
          success: false,
          message: `Insufficient balance. To activate the next batch of ${tasksToFund} tasks, you need at least ${requiredBalance} credits (Current: ${userData.balance}).`,
        };
      }
    }

    // 4. Update Status
    await prisma.dataset.update({
      where: { id: datasetId },
      data: { status: newStatus },
    });

    revalidatePath(`/dashboard/datasets/${datasetId}`);
    revalidatePath(`/dashboard`);
    return { success: true, message: `Dataset is now ${newStatus}` };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Server error updating status.' };
  }
}
