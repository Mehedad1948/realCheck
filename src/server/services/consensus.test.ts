import { describe, expect, it } from 'vitest';
import { computeConsensus } from './consensus';

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
