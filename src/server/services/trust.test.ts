import { describe, expect, it } from 'vitest';
import { GOLD_RATE_AFTER_MISS, GOLD_RATE_NORMAL, GOLD_RATE_PROBATION, GOLD_RATE_TRUSTED } from '@/lib/constants';
import { computeTrust, goldRate, isSuspended, sampleGoldCount, toReputation } from './trust';

describe('computeTrust', () => {
  it('starts new evaluators at 0.75', () => {
    expect(computeTrust(0, 0)).toBe(0.75);
    expect(toReputation(computeTrust(0, 0))).toBe(75);
  });

  it('moves toward observed accuracy as evidence grows', () => {
    expect(computeTrust(48, 50)).toBeCloseTo(51 / 54);
    expect(computeTrust(20, 50)).toBeCloseTo(23 / 54);
  });
});

describe('isSuspended', () => {
  it('waits for enough golden answers before judging', () => {
    expect(isSuspended({ trust: 0.3, goldAnswered: 3, lastGoldCorrect: false })).toBe(false);
  });

  it('suspends low trust once there is evidence', () => {
    expect(isSuspended({ trust: computeTrust(4, 8), goldAnswered: 8, lastGoldCorrect: false })).toBe(true);
    expect(isSuspended({ trust: computeTrust(5, 8), goldAnswered: 8, lastGoldCorrect: true })).toBe(false);
  });
});

describe('goldRate', () => {
  it('checks newcomers, recent misses and veterans at different rates', () => {
    expect(goldRate({ trust: 0.75, goldAnswered: 2, lastGoldCorrect: true })).toBe(GOLD_RATE_PROBATION);
    expect(goldRate({ trust: 0.95, goldAnswered: 40, lastGoldCorrect: false })).toBe(GOLD_RATE_AFTER_MISS);
    expect(goldRate({ trust: 0.95, goldAnswered: 40, lastGoldCorrect: true })).toBe(GOLD_RATE_TRUSTED);
    expect(goldRate({ trust: 0.8, goldAnswered: 40, lastGoldCorrect: true })).toBe(GOLD_RATE_NORMAL);
  });
});

describe('sampleGoldCount', () => {
  it('draws one slot per trial', () => {
    const rolls = [0.05, 0.5, 0.2, 0.9];
    let i = 0;
    expect(sampleGoldCount(4, 0.3, () => rolls[i++])).toBe(2);
  });
});
