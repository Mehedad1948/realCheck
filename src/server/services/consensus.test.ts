import { describe, expect, it } from 'vitest';
import { computeConsensus, posterior, resolveTask } from './consensus';

describe('computeConsensus', () => {
  it('picks the majority label', () => {
    expect(
      computeConsensus([
        { selection: 'Positive', votes: 2 },
        { selection: 'Negative', votes: 1 },
      ]),
    ).toEqual({ label: 'Positive', agreement: 2 / 3 });
  });

  it('reports full agreement', () => {
    expect(computeConsensus([{ selection: 'Red', votes: 3 }])).toEqual({ label: 'Red', agreement: 1 });
  });

  it('leaves ties unlabeled', () => {
    expect(
      computeConsensus([
        { selection: 'A', votes: 1 },
        { selection: 'B', votes: 1 },
      ]),
    ).toEqual({ label: null, agreement: 0.5 });
  });

  it('handles no votes', () => {
    expect(computeConsensus([])).toEqual({ label: null, agreement: 0 });
  });
});

const trusted = (selection: string, trust = 0.8) => ({ selection, trust });
const yesNo = ['Yes', 'No'];

describe('resolveTask', () => {
  it('resolves unanimous votes, even from new evaluators', () => {
    expect(resolveTask([trusted('Yes', 0.75), trusted('Yes', 0.75)], yesNo, { targetVotes: 2, maxVotes: 4 })).toMatchObject({
      kind: 'resolved',
      label: 'Yes',
      agreement: 1,
    });
  });

  it('escalates a split to the next odd vote count', () => {
    expect(resolveTask([trusted('Yes'), trusted('No')], yesNo, { targetVotes: 2, maxVotes: 5 })).toEqual({
      kind: 'escalate',
      targetVotes: 3,
    });
    expect(resolveTask([trusted('Yes'), trusted('Yes'), trusted('No')], yesNo, { targetVotes: 3, maxVotes: 5 })).toEqual({
      kind: 'escalate',
      targetVotes: 5,
    });
  });

  it('never escalates past maxVotes', () => {
    expect(resolveTask([trusted('Yes'), trusted('No')], yesNo, { targetVotes: 2, maxVotes: 2 })).toMatchObject({ kind: 'disputed' });
    expect(resolveTask([trusted('Yes'), trusted('Yes'), trusted('No')], yesNo, { targetVotes: 3, maxVotes: 4 })).toEqual({
      kind: 'escalate',
      targetVotes: 4,
    });
  });

  it('resolves a split when trusted evaluators carry the majority', () => {
    const result = resolveTask([trusted('Yes', 0.95), trusted('Yes', 0.95), trusted('No', 0.6)], yesNo, { targetVotes: 3, maxVotes: 5 });
    expect(result).toMatchObject({ kind: 'resolved', label: 'Yes' });
  });

  it('resolves a clear 4 to 1 majority at the cap', () => {
    const votes = [...Array(4)].map(() => trusted('Yes')).concat(trusted('No'));
    expect(resolveTask(votes, yesNo, { targetVotes: 5, maxVotes: 5 })).toMatchObject({ kind: 'resolved', label: 'Yes' });
  });

  it('disputes a narrow split at the cap', () => {
    const votes = [trusted('Yes'), trusted('Yes'), trusted('Yes'), trusted('No'), trusted('No')];
    expect(resolveTask(votes, yesNo, { targetVotes: 5, maxVotes: 5 })).toMatchObject({ kind: 'disputed', agreement: 0.6 });
  });
});

describe('posterior', () => {
  it('sums to one and favors the more trusted side', () => {
    const scores = posterior([trusted('Yes', 0.95), trusted('No', 0.6)], yesNo);
    expect((scores.get('Yes') ?? 0) + (scores.get('No') ?? 0)).toBeCloseTo(1);
    expect(scores.get('Yes')).toBeGreaterThan(0.9);
  });

  it('treats agreement on one of many options as stronger evidence', () => {
    const two = posterior([trusted('A'), trusted('A')], ['A', 'B']).get('A') ?? 0;
    const five = posterior([trusted('A'), trusted('A')], ['A', 'B', 'C', 'D', 'E']).get('A') ?? 0;
    expect(five).toBeGreaterThan(two);
  });
});
