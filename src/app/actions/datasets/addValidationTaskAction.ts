'use server';

import { getSession } from '@/lib/auth'; // Assuming you have this
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addValidationTaskAction(prevState: any, formData: FormData) {
  const session = await getSession();
  if (session?.role !== 'CLIENT' || !session.id) {
    return { success: false, message: 'Unauthorized: Only clients can add tasks.' };
  }

  const datasetId = formData.get('datasetId') as string;
  const content = formData.get('content') as string;
  const correctAnswer = formData.get('correctAnswer') as string;

  if (!datasetId || !content || !correctAnswer) {
    return { success: false, message: 'All fields must be filled.' };
  }

  try {
    const dataset = await prisma.dataset.findUnique({
      where: { id: datasetId },
    });

    // Security Check: Ensure the user owns this dataset
    if (!dataset || dataset.ownerId !== session.id) {
      return { success: false, message: 'Dataset not found or access denied.' };
    }

    // Validation Check: Ensure the provided answer is a valid option
    if (!dataset.options.includes(correctAnswer)) {
      return { success: false, message: `The correct answer must be one of [${dataset.options.join(', ')}].` };
    }

    await prisma.task.create({
      data: {
        datasetId: datasetId,
        content: content,
        imageUrls: dataset.dataType === 'IMAGE' ? [content] : [],
        isValidation: true, // Mark this as a validation task
        correctAnswer: correctAnswer, // Store the known correct answer
        status: 'ACTIVE',
        collectedVotes: 0, // Validation tasks don't need to be completed by consensus
      },
    });

    // Revalidate the dataset page to show the new task (optional)
    revalidatePath(`/dashboard/datasets/${datasetId}`);

    return { success: true, message: 'Validation question added successfully!' };

  } catch (error) {
    console.error("Failed to add validation task:", error);
    return { success: false, message: 'A server error occurred.' };
  }
}
