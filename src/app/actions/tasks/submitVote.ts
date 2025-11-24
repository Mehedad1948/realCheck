'use server';

export async function submitVote(taskId: string, vote: string) {
  // In real life:
  // 1. Check user session (Telegram initData)
  // 2. Save vote to DB
  // 3. Update user balance

  console.log(`[SERVER ACTION] Processing vote: ${vote} for Task ${taskId}`);

  // Simulate delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    message: 'Vote Recorded',
    reward: 0.05,
  };
}
