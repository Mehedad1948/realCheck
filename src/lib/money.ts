import { CURRENCY, PLATFORM_FEE_BPS } from './constants';

const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY });

/** All money is stored as integer cents. */
export function formatMoney(cents: number) {
  return formatter.format(cents / 100);
}

export function dollarsToCents(dollars: number) {
  return Math.round(dollars * 100);
}

/** The platform's fee on one paid answer. Rounded up so a fee is never lost to rounding. */
export function platformFeeCents(rewardCents: number) {
  return Math.ceil((rewardCents * PLATFORM_FEE_BPS) / 10_000);
}

/** What the dataset owner pays per paid answer: the evaluator's reward plus the platform fee. */
export function chargePerAnswerCents(rewardCents: number) {
  return rewardCents + platformFeeCents(rewardCents);
}
