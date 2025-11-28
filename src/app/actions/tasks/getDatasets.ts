'use server';

import { prisma } from '@/lib/prisma';
import { paginate } from '@/lib/reqeusts/pagination'; // Matching your path
import { Dataset } from '@prisma/client';

export async function getActiveDatasets(page = 1, limit = 10) {
  try {
    const result = await paginate<Dataset, any>(
      prisma.dataset,
      {
        // 1. Filter ONLY Active datasets
        where: {
          status: 'ACTIVE',
        },
        // 2. Sort by newest first
        orderBy: {
          createdAt: 'desc',
        },
        // 3. (Optional) Get the count of tasks inside this dataset
        // This is great for displaying "Total Tasks: 50" on the UI card
        include: {
          _count: {
            select: { tasks: true },
          },
        },
      },
      { page, limit }
    );

    return { success: true, ...result };
  } catch (error) {
    return {
      success: false,
      data: [],
      error: 'Failed to fetch datasets',
    };
  }
}
