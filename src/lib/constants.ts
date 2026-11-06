// Business rules shared by the server and the UI.

/** Tasks served to an evaluator per batch in the Mini App. */
export const TASK_BATCH_SIZE = 10;
/** Candidate tasks considered before shuffling, so evaluators don't all get the same batch. */
export const TASK_CANDIDATE_POOL = 200;

/** How long a served task holds its vote slot for the evaluator. */
export const TASK_LEASE_MS = 10 * 60 * 1000;

// Trust: Beta(TRUST_PRIOR_CORRECT, TRUST_PRIOR_WRONG) prior over the last TRUST_WINDOW
// golden answers. A new evaluator starts at 3 / 4 = 0.75.
export const TRUST_WINDOW = 50;
export const TRUST_PRIOR_CORRECT = 3;
export const TRUST_PRIOR_WRONG = 1;
/** Evaluators below this trust stop receiving tasks, once they've answered TRUST_MIN_GOLD golden tasks. */
export const MIN_TRUST = 0.6;
export const TRUST_MIN_GOLD = 8;
/** Reputation is trust shown as 0..100. */
export const MIN_REPUTATION = Math.round(MIN_TRUST * 100);

// Share of each batch that is golden tasks, by evaluator standing.
/** Until an evaluator has answered this many golden tasks, they are on probation. */
export const PROBATION_GOLD = 10;
export const GOLD_RATE_PROBATION = 0.3;
export const GOLD_RATE_AFTER_MISS = 0.25;
export const GOLD_RATE_NORMAL = 0.1;
export const GOLD_RATE_TRUSTED = 0.05;
/** Trusted evaluators get fewer spot checks. */
export const TRUSTED_TRUST = 0.9;
export const TRUSTED_MIN_GOLD = 30;
/** A golden task is retired after this many answers: by then its answer has likely leaked. */
export const GOLD_MAX_EXPOSURES = 100;

/** A split vote resolves when the trust-weighted winner is at least this likely to be right. */
export const CONSENSUS_CONFIDENCE = 0.85;
/** Answers faster than this are flagged as likely not read. */
export const MIN_RESPONSE_MS = 1500;

// Money. All amounts are integer cents.
/** Platform fee charged to the dataset owner on top of each paid reward, in basis points (2000 = 20%). */
export const PLATFORM_FEE_BPS = 2000;
/** Rewards stay pending this long before they can be withdrawn, so cheating found later can be undone. */
export const REWARD_HOLD_DAYS = 7;
export const TRUSTED_REWARD_HOLD_DAYS = 2;
/** Smallest payout, well above the TON network fee the platform pays per transfer. */
export const MIN_WITHDRAWAL_CENTS = 200;
/** Payouts are sent in USDT on TON, 1 USDT = 1 USD. */
export const PAYOUT_ASSET = 'USDT';

/** To activate a dataset the owner must be able to fund at least this many tasks. */
export const ACTIVATION_FUNDING_TASKS = 50;

export const MAX_OPTIONS = 10;
export const MAX_REQUIRED_VOTES = 50;
export const MAX_TASK_CONTENT_LENGTH = 5000;
/** Rows per upload request; keeps each Server Action body well under the size limit. */
export const UPLOAD_CHUNK_SIZE = 500;

export const MAX_TOP_UP_CENTS = 100_000;
export const CURRENCY = 'USD';
