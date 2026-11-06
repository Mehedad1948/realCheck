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
  /** Withdrawable now. */
  balanceCents: number;
  /** Earned but still in the hold period. */
  pendingCents: number;
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
  pendingCents: number;
};

export type EarningsEntry = {
  id: string;
  type: 'TASK_REWARD' | 'CLAWBACK' | 'WITHDRAWAL' | 'WITHDRAWAL_REVERSAL' | 'ADJUSTMENT';
  amountCents: number;
  datasetTitle: string | null;
  createdAt: string;
};

/** Per dataset id: active tasks this evaluator has not answered yet. */
export type OpenTaskCounts = { remaining: Record<string, number> };

/** A dataset the evaluator has answered in, with their results there. */
export type HistoryDataset = {
  id: string;
  title: string;
  dataType: DataType;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  answers: number;
  earnedCents: number;
  /** Share of resolved answers that matched the consensus, 0..1, or null before any resolved. */
  accuracy: number | null;
  /** Answers whose task has not been resolved yet. */
  pending: number;
  lastAnsweredAt: string;
};

export type HistoryOutcome = 'match' | 'mismatch' | 'tie' | 'pending';

export type HistoryAnswer = {
  taskId: string;
  content: string;
  imageUrl: string | null;
  selection: string;
  outcome: HistoryOutcome;
  /** Only set on a mismatch. */
  consensusLabel: string | null;
  answeredAt: string;
};

export type DatasetHistory = {
  dataset: HistoryDataset & { question: string; remaining: number };
  answers: HistoryAnswer[];
};

export type Earnings = {
  todayCents: number;
  weekCents: number;
  totalCents: number;
  recent: EarningsEntry[];
};

export type WithdrawalStatus = 'REQUESTED' | 'APPROVED' | 'SENDING' | 'SENT' | 'REJECTED' | 'FAILED';

export type WithdrawalSummary = {
  id: string;
  amountCents: number;
  status: WithdrawalStatus;
  /** User-friendly destination address. */
  address: string;
  txHash: string | null;
  createdAt: string;
};

export type PayoutWallet = {
  /** User-friendly, non-bounceable address. */
  address: string;
  linkedAt: string;
};

export type Payouts = {
  balanceCents: number;
  pendingCents: number;
  /** When the next pending reward becomes available, or null if none are pending. */
  nextReleaseAt: string | null;
  minWithdrawalCents: number;
  asset: string;
  network: 'mainnet' | 'testnet';
  canWithdraw: boolean;
  wallet: PayoutWallet | null;
  withdrawals: WithdrawalSummary[];
};
