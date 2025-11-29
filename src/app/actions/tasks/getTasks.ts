'use server';

import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function getTasksForUser(datasetId?: string) {
  const user = await getSessionUser();

  if (!user) return [];

  // CONFIGURATION
  const BATCH_SIZE = 10; // How many to give the user
  const POOL_SIZE = 500; // How wide we cast the net to prevent collisions

  try {
    // 1. Fetch a LARGE pool of candidates
    const candidateTasks = await prisma.task.findMany({
      where: {
        ...(datasetId && { datasetId }),
        status: 'ACTIVE',
        votes: {
          none: { userId: user.id },
        },
      },
      orderBy: {
        collectedVotes: 'asc',
      },
      take: POOL_SIZE,
      select: {
        id: true,
        textContent: true,
        imageUrls: true,

        // We still need to fetch the relation data
        dataset: {
          select: {
            question: true,
            options: true,
            dataType: true,
            reward: true,
          },
        },
      },
    });

    if (candidateTasks.length === 0) return [];

    // 2. Shuffle
    const shuffled = candidateTasks.sort(() => 0.5 - Math.random());

    // 3. Slice and Flatten
    // We take the top 10, then remap them so the keys are on the top level
    return shuffled.slice(0, BATCH_SIZE).map((task) => ({
      id: task.id,
      textContent: task.textContent,
      imageUrls: task.imageUrls,
      // Flattening the dataset fields to the top level
      question: task.dataset.question,
      options: task.dataset.options,
      dataType: task.dataset.dataType,
      reward: task.dataset.reward,
    }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}
