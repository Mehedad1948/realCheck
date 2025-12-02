'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function addTasksToDataset(
  datasetId: string,
  tasksData: { content: string }[]
) {
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

    // 2. Fetch Dataset to check Type AND Ownership
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      select: { 
        dataType: true, 
        ownerId: true 
      },
    });

    if (!dataset) {
      return { success: false, error: 'Dataset not found' };
    }

    // 3. Enforce Ownership
    if (dataset.ownerId !== session.id) {
      return { success: false, error: 'Forbidden: You do not own this dataset.' };
    }

    // 4. Map Input Data to Prisma Schema
    const formattedTasks = tasksData.map((t) => {
      const isImageDataset = dataset.dataType === 'IMAGE';

      return {
        datasetId,
        
        // A: Always store the raw input in 'content' (JSON field)
        content: t.content, 

        // B: If it's an Image dataset, ALSO populate the 'imageUrls' array
        // This ensures your specific schema field is used.
        imageUrls: isImageDataset ? [t.content] : [], 
        
        status: 'ACTIVE', 
        collectedVotes: 0
      };
    });

    // 5. Bulk Insert
    const result = await prisma.task.createMany({
      data: formattedTasks,
      skipDuplicates: true, 
    });

    console.log(`Added ${result.count} tasks to dataset ${datasetId}`);

    // 6. Revalidate Cache
    revalidatePath(`/dashboard/datasets/${datasetId}`);
    revalidatePath('/dashboard/datasets'); 

    return { success: true, count: result.count };

  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Failed to save tasks. Please try again.' };
  }
}
