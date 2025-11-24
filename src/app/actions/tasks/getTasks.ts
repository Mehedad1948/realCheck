// app/actions.ts
'use server'

// Mock DB for now
const tasks = [
  { id: "101", type: "sentiment", content: "RealCheck is fast!", reward: 0.05 },
  { id: "102", type: "sentiment", content: "Server Actions are cool.", reward: 0.05 },
];

export async function getTasks() {
  // In real life: await db.tasks.findMany(...)
  return tasks;
}

