import {
  GOLD_RATE_AFTER_MISS,
  GOLD_RATE_NORMAL,
  GOLD_RATE_PROBATION,
  GOLD_RATE_TRUSTED,
  MIN_TRUST,
  PROBATION_GOLD,
  TRUST_MIN_GOLD,
  TRUST_PRIOR_CORRECT,
  TRUST_PRIOR_WRONG,
  TRUSTED_MIN_GOLD,
  TRUSTED_TRUST,
} from '@/lib/constants';

// How much we trust an evaluator, and how hard we check them. Pure, so it is unit tested
// and shared by the vote path, batch serving and the backfill in the migration.

export type Standing = { trust: number; goldAnswered: number; lastGoldCorrect: boolean | null };

/** Posterior mean accuracy from recent golden answers. */
export function computeTrust(correct: number, total: number) {
  return (correct + TRUST_PRIOR_CORRECT) / (total + TRUST_PRIOR_CORRECT + TRUST_PRIOR_WRONG);
}

export function toReputation(trust: number) {
  return Math.round(trust * 100);
}

/** Too few golden answers to judge yet is not a reason to stop someone. */
export function isSuspended({ trust, goldAnswered }: Standing) {
  return goldAnswered >= TRUST_MIN_GOLD && trust < MIN_TRUST;
}

/** Share of a batch that should be golden tasks for this evaluator. */
export function goldRate({ trust, goldAnswered, lastGoldCorrect }: Standing) {
  if (goldAnswered < PROBATION_GOLD) return GOLD_RATE_PROBATION;
  if (lastGoldCorrect === false) return GOLD_RATE_AFTER_MISS;
  if (trust >= TRUSTED_TRUST && goldAnswered >= TRUSTED_MIN_GOLD) return GOLD_RATE_TRUSTED;
  return GOLD_RATE_NORMAL;
}

/** Number of golden slots in a batch of `size`. Random, so evaluators can't count on a pattern. */
export function sampleGoldCount(size: number, rate: number, random = Math.random) {
  let count = 0;
  for (let i = 0; i < size; i++) if (random() < rate) count++;
  return count;
}
