// app/actions/tasks.ts
'use server'

import { Task } from '@/lib/types/tasks'; // Ensure this path matches your file structure

// Mock Data
const MOCK_TASKS: Task[] = [
    {
        id: "t1",
        type: "text_classification",
        question: "Is this review positive?",
        text_content: "The product broke after two days. Terrible quality.",
        options: ["Positive", "Negative"],
        reward: 0.05,
        is_validation: false
    },
    {
        id: "t2",
        type: "image_labeling",
        question: "Select the object in the image",
        image_urls: ["https://dummyimage.com/600x400/000/fff&text=Cat+Image"],
        options: ["Car", "Cat", "Building"],
        reward: 0.1,
        is_validation: false
    },
    {
        id: "v1", 
        type: "text_classification",
        question: "What is 2 + 2?",
        text_content: "Simple math check.",
        options: ["3", "4", "5"],
        reward: 0.00,
        is_validation: true,
        correct_answer: "4"
    }
];

// --- CHANGED: Return Task[] (Array) instead of Task (Single) ---
export async function getTasks(userId?: string): Promise<Task[]> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return the full batch so the UI can iterate through them
    return MOCK_TASKS;
}

