// Business rules shared by the server and the UI.

/** Tasks served to an evaluator per batch in the Mini App. */
export const TASK_BATCH_SIZE = 10;
/** Candidate tasks considered before shuffling, so evaluators don't all get the same batch. */
export const TASK_CANDIDATE_POOL = 200;

/** Evaluators below this reputation stop receiving tasks. */
export const MIN_REPUTATION = 50;
export const GOLD_CORRECT_REPUTATION = 1;
export const GOLD_WRONG_REPUTATION = -2;

/** To activate a dataset the owner must be able to fund at least this many tasks. */
export const ACTIVATION_FUNDING_TASKS = 50;

export const MAX_OPTIONS = 10;
export const MAX_REQUIRED_VOTES = 50;
export const MAX_TASK_CONTENT_LENGTH = 5000;
/** Rows per upload request; keeps each Server Action body well under the size limit. */
export const UPLOAD_CHUNK_SIZE = 500;

export const MAX_TOP_UP_CENTS = 100_000;
export const CURRENCY = 'USD';
