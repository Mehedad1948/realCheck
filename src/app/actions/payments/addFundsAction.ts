'use server';

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addFundsAction(amount: number) {
  try {
    const session = await getSession()
    if (!session || !session.user || !session.user.email) {
      return { success: false, message: "Unauthorized" };
    }

    // Update User Balance
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        balance: { increment: amount }
      }
    });

    // Revalidate to update the UI immediately
    revalidatePath('/dashboard/datasets');
    revalidatePath('/dashboard/datasets/[datasetId]');
    
    return { success: true, message: "Funds added successfully" };
  } catch (error) {
    console.error("Payment error:", error);
    return { success: false, message: "Transaction failed" };
  }
}
