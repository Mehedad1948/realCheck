'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { decrypt } from '@/lib/auth'; // Ensure this is imported from your auth lib
import { redirect } from 'next/navigation';

// Updated input type: Removed 'clientId' because we get it from the session now
type CreateDatasetInput = {
  title: string;
  description: string;
  dataType: 'TEXT' | 'IMAGE';
  question: string;
  options: string[];
  requiredVotes: number;
};

export async function createDataset(data: CreateDatasetInput) {
  try {
    // 1. Get the session cookie to authenticate the user
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
        return { success: false, error: 'Unauthorized: No session found' };
    }

    // 2. Decrypt the session to get user details
    const session = await decrypt(sessionCookie);

    if (!session?.id || session.role !== 'CLIENT') {
        return { success: false, error: 'Unauthorized: Only Clients can create datasets' };
    }

    console.log('Creating dataset for User (Owner):', session.id);

    // 3. Create the dataset linked to the logged-in user (ownerId)
    const newDataset = await prisma.dataset.create({
      data: {
        title: data.title,
        description: data.description,
        dataType: data.dataType,
        question: data.question,
        options: data.options,
        requiredVotes: data.requiredVotes,
        ownerId: session.id as string, // Connects to the User model
        status: 'ACTIVE',
        reward: 50, // Hardcoded default, or add to Input type if needed
      },
    });

    console.log('Dataset Created:', newDataset.id);

    // 4. Revalidate cache
    revalidatePath('/dashboard/datasets');
    // revalidateTag only accepts one argument
    // revalidateTag('datasetsList'); 

    return { success: true, datasetId: newDataset.id };

  } catch (error) {
    console.error('Failed to create dataset:', error);
    return { success: false, error: 'Failed to create dataset' };
  }
}
