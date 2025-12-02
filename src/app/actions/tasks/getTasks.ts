'use server';

import { getSessionUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function getTasksForUser(datasetId?: string) {
  // 1. Secure Session Check
  const user = await getSessionUser();
  console.log('🚀🚀🚀 User', user);

  if (!user) return [];

  // CONFIGURATION
  const BATCH_SIZE = 10;
  const POOL_SIZE = 500;

  try {
    // 2. Fetch Candidates
    const candidateTasks = await prisma.task.findMany({
      where: {
        // Filter A: Specific Dataset (if requested)
        ...(datasetId ? { datasetId } : {}),

        // Filter B: Ensure the DATASET itself is Active
        dataset: {
          status: 'ACTIVE',
        },

        // Filter C: Task is not already finished
        status: {
          not: 'COMPLETED',
        },

        // Filter D: User has NOT voted on this task yet
        // votes: {
        //   none: { userId: user.id },
        // },
      },
      orderBy: {
        collectedVotes: 'asc', // Prioritize tasks needing votes
      },
      take: POOL_SIZE,
      select: {
        id: true,
        content: true,
        imageUrls: true,
        // REMOVED 'imageUrls: true' because your Prisma Client doesn't see it yet.
        // We will derive it from 'content' below.

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

    console.log('🐞🐞🎮🎮 candidateTasks', candidateTasks);

    if (candidateTasks.length === 0) return [];

    // 3. Shuffle
    const shuffled = candidateTasks.sort(() => 0.5 - Math.random());

    // 4. Slice & Map
    return shuffled.slice(0, BATCH_SIZE).map((task) => {
      // Safe cast for content
      const contentString = (task.content as string) || '';

      // FALLBACK LOGIC:
      // If it's an IMAGE dataset, the 'content' field stores the URL string.
      // We wrap it in an array to mimic the expected 'imageUrls' format.
      let derivedImages: string[] = [];
      if (task.dataset.dataType === 'IMAGE' && contentString) {
        derivedImages = [contentString];
      }

      return {
        id: task.id,
        content: contentString,
        imageUrls: derivedImages, // Populated from content logic

        // Flatten dataset config
        question: task.dataset.question,
        options: (task.dataset.options as string[]) ?? [],
        dataType: task.dataset.dataType,
        reward: task.dataset.reward,
      };
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}
