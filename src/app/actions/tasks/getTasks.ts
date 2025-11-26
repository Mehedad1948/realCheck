'use server'

import { prisma } from '@/lib/prisma'
import { Task } from '@/lib/types/tasks'

export async function getTasks(taskType: 'text_classification' | 'image_labeling'): Promise<Task[]> {
  try {
    const dbTasks = await prisma.task.findMany({
      where: { 
        type: taskType // Matches the string stored in DB
      },
      take: 20, // Limit to 20 tasks for now
    })

    // MAP Database Fields -> Frontend Interface
    const tasks: Task[] = dbTasks.map((t) => ({
      id: t.id,
      // Force cast because we know our DB string matches the TS type
      type: t.type as 'text_classification' | 'image_labeling', 
      question: t.question,
      options: t.options,
      reward: t.reward,
      
      // Mapping camelCase (DB) to snake_case (Frontend)
      text_content: t.textContent || undefined,
      image_urls: t.imageUrls.length > 0 ? t.imageUrls : undefined,
      is_validation: t.isValidation,
      correct_answer: t.correctAnswer || undefined,
    }))

    return tasks
  } catch (error) {
    console.error("Error fetching tasks:", error)
    return []
  }
}
