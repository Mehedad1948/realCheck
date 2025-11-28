export interface Task {
  id: string;
  type: string;
  question: string;

  // New Separated Content Fields
  textContent: string | null; // Optional: for text tasks
  imageUrls?: string[]; // Optional: array allows for carousels or single images

  options: string[];
  reward: number;

  // Validation / Credibility Props (Backend logic primarily)
  isValidation?: boolean; // If true, this is a test
  correctAnswer: string | null; // The expected answer for validation tasks
}

export interface UserState {
  telegramId: number;
  balance: number;
  reputation_score: number; // New: Track how accurate they are (0.0 to 1.0)
}
