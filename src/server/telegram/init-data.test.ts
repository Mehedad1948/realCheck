import { describe, expect, it } from 'vitest';
import { InitDataError, signInitData, validateInitData } from './init-data';

const BOT_TOKEN = '123456:TEST-token';
const NOW = 1_800_000_000_000;
const user = { id: 42, first_name: 'Ada', username: 'ada' };

function launch(overrides: Record<string, string> = {}) {
  return signInitData(
    {
      auth_date: String(NOW / 1000 - 60),
      query_id: 'AAH',
      user: JSON.stringify(user),
      start_param: 'ds_abc',
      ...overrides,
    },
    BOT_TOKEN,
  );
}

function reason(fn: () => unknown) {
  try {
    fn();
  } catch (error) {
    if (error instanceof InitDataError) return error.reason;
    throw error;
  }
  return 'OK';
}

describe('validateInitData', () => {
  it('accepts data signed with the bot token', () => {
    const data = validateInitData(launch(), BOT_TOKEN, { maxAgeSeconds: 3600, now: NOW });
    expect(data.user).toMatchObject(user);
    expect(data.startParam).toBe('ds_abc');
    expect(data.authDate.getTime()).toBe(NOW - 60_000);
  });

  it('rejects data signed with another token', () => {
    const raw = signInitData({ auth_date: String(NOW / 1000), user: JSON.stringify(user) }, '999:other');
    expect(reason(() => validateInitData(raw, BOT_TOKEN, { maxAgeSeconds: 3600, now: NOW }))).toBe('BAD_SIGNATURE');
  });

  it('rejects tampered fields', () => {
    const raw = launch().replace(encodeURIComponent('"id":42'), encodeURIComponent('"id":43'));
    expect(reason(() => validateInitData(raw, BOT_TOKEN, { maxAgeSeconds: 3600, now: NOW }))).toBe('BAD_SIGNATURE');
  });

  it('rejects data without a hash', () => {
    expect(reason(() => validateInitData('user=%7B%7D&auth_date=1', BOT_TOKEN, { maxAgeSeconds: 3600 }))).toBe(
      'MISSING_HASH',
    );
  });

  it('rejects expired and future-dated launches', () => {
    const old = launch({ auth_date: String(NOW / 1000 - 7200) });
    expect(reason(() => validateInitData(old, BOT_TOKEN, { maxAgeSeconds: 3600, now: NOW }))).toBe('EXPIRED');
    const future = launch({ auth_date: String(NOW / 1000 + 600) });
    expect(reason(() => validateInitData(future, BOT_TOKEN, { maxAgeSeconds: 3600, now: NOW }))).toBe('EXPIRED');
  });

  it('rejects a signed payload without a valid user', () => {
    const raw = launch({ user: '{"first_name":"no id"}' });
    expect(reason(() => validateInitData(raw, BOT_TOKEN, { maxAgeSeconds: 3600, now: NOW }))).toBe('MALFORMED');
  });
});
