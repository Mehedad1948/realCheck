'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ... (your existing addTasksToDataset function) ...

export async function deleteAllTasksFromDataset(datasetId: string) {
  try {
    // 1. Authenticate User
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return { success: false, error: 'Unauthorized: No session found' };
    }

    const session = await decrypt(sessionCookie);

    if (!session?.id) {
      return { success: false, error: 'Unauthorized: Invalid session' };
    }

    // 2. Fetch Dataset to check Ownership
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      select: { ownerId: true },
    });

    if (!dataset) {
      return { success: false, error: 'Dataset not found' };
    }

    // 3. Enforce Ownership
    if (dataset.ownerId !== session.id) {
      return { success: false, error: 'Forbidden: You do not own this dataset.' };
    }

    // 4. Delete All Tasks for this Dataset
    const result = await prisma.task.deleteMany({
      where: {
        datasetId: datasetId,
      },
    });

    console.log(`Deleted ${result.count} tasks from dataset ${datasetId}`);

    // 5. Revalidate Cache
    revalidatePath(`/dashboard/datasets/${datasetId}`);
    revalidatePath('/dashboard/datasets');

    return { success: true, count: result.count };

  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, error: 'Failed to delete tasks. Please try again.' };
  }
}
