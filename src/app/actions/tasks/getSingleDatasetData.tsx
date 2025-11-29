'use server';

import { prisma } from '@/lib/prisma';

export async function getDataset(datasetId: string) {
  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      include: {
        _count: {
          select: { tasks: true } // This gives you dataset._count.tasks
        }
      }
    });

    if (!dataset) {
      return { success: false, error: "Dataset not found" };
    }

    return { success: true, data: dataset };

  } catch (error) {
    console.error("Error fetching dataset:", error);
    return { success: false, error: "Failed to retrieve dataset" };
  }
}
