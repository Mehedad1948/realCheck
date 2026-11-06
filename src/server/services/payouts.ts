import 'server-only';
import type { Evaluator } from '@/server/auth/tma';
import { prisma } from '@/server/db';
import { clawbackPendingRewards, releaseMaturedRewards } from '@/server/ledger';
import { isSuspended } from './trust';

// The evaluator's side of getting paid.

/**
 * Releases rewards whose hold period has ended, or claws everything back if the
 * evaluator has been suspended. Runs whenever the evaluator looks at their money,
 * so no scheduled job is needed.
 */
export async function settleRewards(evaluator: Evaluator) {
  await prisma.$transaction((tx) =>
    isSuspended(evaluator) ? clawbackPendingRewards(tx, evaluator.id) : releaseMaturedRewards(tx, evaluator.id),
  );
}
