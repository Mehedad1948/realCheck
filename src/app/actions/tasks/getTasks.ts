'use server';

import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function getTasksForUser(datasetId?: string) {
  const user = await getSessionUser();
  if (!user) return [];

  const BATCH_SIZE = 10;

  try {
    const candidateTasks = await prisma.task.findMany({
      where: {
        ...(datasetId ? { datasetId } : {}),
        
        // Ensure the Dataset is Active
        dataset: {
          status: 'ACTIVE',
        },
        
        // Ensure Task is not finished (using PENDING based on schema suggestion)
        status: 'PENDING',

        // User hasn't voted yet
        votes: {
          none: { userId: user.id },
        },
      },
      orderBy: { collectedVotes: 'asc' },
      take: 500, // Pool size
      include: {
        dataset: {
          select: {
            question: true,
            options: true, // This is now automatically string[]
            dataType: true,
            reward: true,
          },
        },
      },
    });

    if (candidateTasks.length === 0) return [];

    const shuffled = candidateTasks.sort(() => 0.5 - Math.random());

    return shuffled.slice(0, BATCH_SIZE).map((task) => ({
      id: task.id,
      
      // DIRECT ASSIGNMENT (No casting needed anymore)
      content: task.content, 
      imageUrls: task.imageUrls, 

      question: task.dataset.question,
      options: task.dataset.options, // This is already string[]
      dataType: task.dataset.dataType,
      reward: task.dataset.reward,
    }));

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}
