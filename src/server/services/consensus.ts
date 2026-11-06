import { CONSENSUS_CONFIDENCE } from '@/lib/constants';

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

export type WeightedVote = { selection: string; trust: number };

/**
 * Probability that each option is the true answer, given who voted for what.
 *
 * One-coin Dawid-Skene: an evaluator with trust p picks the true option with
 * probability p and each of the other k - 1 options with probability (1 - p) / (k - 1).
 * Starting from a uniform prior, a vote adds log(p (k - 1) / (1 - p)) to its option's log-odds.
 */
export function posterior(votes: WeightedVote[], options: string[]): Map<string, number> {
  const k = Math.max(options.length, 2);
  const logOdds = new Map(options.map((option) => [option, 0]));
  for (const vote of votes) {
    const p = Math.min(Math.max(vote.trust, 0.51), 0.99);
    logOdds.set(vote.selection, (logOdds.get(vote.selection) ?? 0) + Math.log((p * (k - 1)) / (1 - p)));
  }
  const max = Math.max(...logOdds.values());
  let total = 0;
  for (const [option, value] of logOdds) {
    const weight = Math.exp(value - max);
    logOdds.set(option, weight);
    total += weight;
  }
  return new Map([...logOdds].map(([option, weight]) => [option, weight / total]));
}

export type Resolution =
  | { kind: 'resolved'; label: string; agreement: number; confidence: number }
  | { kind: 'escalate'; targetVotes: number }
  | { kind: 'disputed'; agreement: number; confidence: number };

/**
 * Decides what happens to a task that has collected its target votes.
 *
 * Unanimous votes resolve. Split votes resolve if the trust-weighted winner is
 * confident enough; otherwise the task asks for more votes (keeping an odd count so
 * a plain majority can break ties) until it hits maxVotes, then it is disputed.
 */
export function resolveTask(
  votes: WeightedVote[],
  options: string[],
  { targetVotes, maxVotes }: { targetVotes: number; maxVotes: number },
): Resolution {
  const counts = new Map<string, number>();
  for (const vote of votes) counts.set(vote.selection, (counts.get(vote.selection) ?? 0) + 1);
  const scores = posterior(votes, options);
  const [label, confidence] = [...scores].sort((a, b) => b[1] - a[1])[0];
  const agreement = votes.length > 0 ? (counts.get(label) ?? 0) / votes.length : 0;

  if (counts.size === 1 || (confidence >= CONSENSUS_CONFIDENCE && computeConsensus(toTally(counts)).label === label)) {
    return { kind: 'resolved', label, agreement, confidence };
  }
  if (targetVotes < maxVotes) {
    const next = targetVotes + 1;
    return { kind: 'escalate', targetVotes: Math.min(next % 2 === 0 ? next + 1 : next, maxVotes) };
  }
  return { kind: 'disputed', agreement, confidence };
}

function toTally(counts: Map<string, number>): Tally {
  return [...counts].map(([selection, votes]) => ({ selection, votes }));
}
