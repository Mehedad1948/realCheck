// src/app/actions/dataset.ts
'use server';

import { prisma } from '@/lib/prisma';

export async function addTasksToDataset(
  datasetId: string,
  tasksData: { content: string }[]
) {
  try {
    // 1. Get Dataset type to know where to put the data
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      select: { dataType: true },
    });

    if (!dataset) throw new Error('Dataset not found');

    // 2. Map the input data to the correct Prisma field
    // If dataset is TEXT -> content goes to 'textContent'
    // If dataset is IMAGE -> content goes to 'imageUrls' (as an array)
    const formattedTasks = tasksData.map((t) => ({
      datasetId,
      textContent: dataset.dataType === 'TEXT' ? t.content : null,
      // For MVP, assuming image input is a single URL string
      imageUrls: dataset.dataType === 'IMAGE' ? [t.content] : [],
    }));

    // 3. Bulk Insert
    await prisma.task.createMany({
      data: formattedTasks,
    });

    return { success: true, count: formattedTasks.length };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Failed to save tasks.' };
  }
}
