'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath, revalidateTag } from 'next/cache';

// Define the input shape based on your UI form
type CreateDatasetInput = {
  title: string;
  description: string;
  dataType: 'TEXT' | 'IMAGE';
  question: string;
  options: string[];
  // In a real app, you'd get clientId from the session
  clientId: string;
  requiredVotes: number; // ✅ Added the new field here
};

export async function createDataset(data: CreateDatasetInput) {
  try {
    console.log('Creating dataset with data:', data);

    const newDataset = await prisma.dataset.create({
      data: {
        title: data.title,
        description: data.description,
        dataType: data.dataType,
        question: data.question,
        options: data.options,
        clientId: data.clientId,
        requiredVotes: data.requiredVotes, // ✅ Mapping the input to the database field
        status: 'ACTIVE',
        reward: 50, // Default reward, you can add a field for this in the UI later
      },
    });

    console.log('Dataset Created:', newDataset.id);

    revalidatePath('/dashboard/datasets');
    revalidateTag('datasetsList', 'max'); // Standard Next.js only takes one argument

    return { success: true, datasetId: newDataset.id };
  } catch (error) {
    console.error('Failed to create dataset:', error);
    return { success: false, error: 'Failed to create dataset' };
  }
}
