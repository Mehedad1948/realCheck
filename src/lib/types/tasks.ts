
export interface Task {
    id: string;
    type: 'text_classification' | 'image_labeling';
    question: string;
    
    // New Separated Content Fields
    text_content?: string;       // Optional: for text tasks
    image_urls?: string[];       // Optional: array allows for carousels or single images
    
    options: string[]; 
    reward: number; 

    // Validation / Credibility Props (Backend logic primarily)
    is_validation?: boolean;     // If true, this is a test
    correct_answer?: string;     // The expected answer for validation tasks
}

export interface UserState {
    telegramId: number;
    balance: number;
    reputation_score: number; // New: Track how accurate they are (0.0 to 1.0)
}
