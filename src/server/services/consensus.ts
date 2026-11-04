export type Tally = { selection: string; votes: number }[];
export type Consensus = { label: string | null; agreement: number };

/**
 * Majority vote. Returns `label: null` on a tie for first place, so ambiguous
 * items are flagged instead of being labeled arbitrarily.
 */
export function computeConsensus(tally: Tally): Consensus {
  const total = tally.reduce((sum, row) => sum + row.votes, 0);
  if (total === 0) return { label: null, agreement: 0 };

  const sorted = [...tally].sort((a, b) => b.votes - a.votes);
  const [top, runnerUp] = sorted;
  const agreement = top.votes / total;
  if (runnerUp && runnerUp.votes === top.votes) return { label: null, agreement };
  return { label: top.selection, agreement };
}
