'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function getDatasetExportData(datasetId: string) {
  const user = await getSession();

  if (!user || user.role !== 'CLIENT') {
    return { success: false, message: 'Unauthorized' };
  }

  try {
    // 1. Verify Ownership
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      select: { ownerId: true, title: true },
    });

    if (!dataset || dataset.ownerId !== user.id) {
      return { success: false, message: 'Unauthorized access to dataset' };
    }

    // 2. Fetch Tasks with Votes
    // We only fetch tasks that have collectedVotes > 0 to keep the file clean,
    // unless you want to see unanswered tasks too.
    const tasks = await prisma.task.findMany({
      where: {
        datasetId: datasetId,
        isValidation: false,
        collectedVotes: { gt: 0 }, // Only get tasks with activity
      },
      select: {
        id: true,
        content: true,
        imageUrls: true,
        status: true,
        collectedVotes: true,
        votes: {
          select: {
            selection: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      success: true,
      data: tasks,
      filename: `${dataset.title
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase()}_export`,
    };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: 'Failed to fetch export data' };
  }
}
