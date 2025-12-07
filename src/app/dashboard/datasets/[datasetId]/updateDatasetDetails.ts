'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function updateDatasetDetails(
  datasetId: string,
  field: 'title' | 'description' | 'requiredVotes',
  value: string | number
) {
  try {
    const session = await getSession();

    if (!session?.email) {
      return { success: false, message: 'Unauthorized' };
    }

    // verify ownership
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
      select: { owner: { select: { email: true } } },
    });

    if (!dataset || dataset.owner.email !== session.email) {
      return { success: false, message: 'Unauthorized' };
    }

    // Perform Update
    // Note: If updating requiredVotes, you might want to add logic here
    // to check if tasks are already completed, but for now we just update the setting.
    await prisma.dataset.update({
      where: { id: datasetId },
      data: {
        [field]: value,
      },
    });

    revalidatePath(`/dashboard/datasets/${datasetId}`);
    return { success: true };
  } catch (error) {
    console.error('Update error:', error);
    return { success: false, message: 'Failed to update' };
  }
}
