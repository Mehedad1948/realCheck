// Response shapes of the BFF (`/api/*`). Shared by route handlers and React Query hooks.
// Dates are ISO strings because these travel as JSON.

export type ApiErrorBody = {
  error: { code: string; message: string; details?: unknown };
};

export type DataType = 'TEXT' | 'IMAGE';

/** A dataset as listed publicly in the Mini App. Never includes owner or answer data. */
export type OpenDataset = {
  id: string;
  title: string;
  description: string | null;
  dataType: DataType;
  rewardCents: number;
  openTasks: number;
};

export type PublicDataset = {
  id: string;
  title: string;
  description: string | null;
  question: string;
  options: string[];
  dataType: DataType;
  rewardCents: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
};

export type EvaluatorProfile = {
  id: string;
  firstName: string | null;
  username: string | null;
  photoUrl: string | null;
  balanceCents: number;
  reputation: number;
  tasksDone: number;
  /** Share of golden tasks answered correctly, 0..1, or null before any were seen. */
  accuracy: number | null;
  canLabel: boolean;
};

/** A task as shown to an evaluator. Golden-task flags and answers are never sent. */
export type TaskCard = {
  id: string;
  content: string;
  imageUrls: string[];
};

export type TaskBatch = {
  datasetId: string;
  tasks: TaskCard[];
};

export type VoteResult = {
  taskId: string;
  rewardCents: number;
  balanceCents: number;
};
