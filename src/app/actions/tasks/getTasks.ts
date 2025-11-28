'use server';

import { prisma } from '@/lib/prisma';
import { paginate } from '@/lib/reqeusts/pagination'; // Make sure this path matches your folder structure
import { Task } from '@prisma/client';

export async function getTasks(datasetId: string, page = 1, limit = 10) {
  const result = await paginate<Task, any>(
    prisma.task,
    {
      where: { datasetId: datasetId },
      orderBy: { id: 'asc' },
    },
    { page, limit }
  );

  return { success: true, ...result };
}
