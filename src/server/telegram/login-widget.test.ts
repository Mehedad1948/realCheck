import { describe, expect, it } from 'vitest';
import { LoginWidgetError, signLoginWidget, validateLoginWidget } from './login-widget';

const BOT_TOKEN = '123456:TEST-token';
const NOW = 1_800_000_000_000;
const fields = { id: '42', first_name: 'Ada', username: 'ada', photo_url: 'https://t.me/i/userpic/ada.jpg' };

function login(overrides: Record<string, string> = {}) {
  return signLoginWidget({ auth_date: String(NOW / 1000 - 60), ...fields, ...overrides }, BOT_TOKEN);
}

function reason(fn: () => unknown) {
  try {
    fn();
  } catch (error) {
    if (error instanceof LoginWidgetError) return error.reason;
    throw error;
  }
  return 'OK';
}

const options = { maxAgeSeconds: 3600, now: NOW };

describe('validateLoginWidget', () => {
  it('accepts data signed with the bot token', () => {
    expect(validateLoginWidget(login(), BOT_TOKEN, options)).toEqual({ ...fields, id: 42 });
  });

  it('rejects data signed with another token', () => {
    const params = signLoginWidget({ auth_date: String(NOW / 1000), ...fields }, '999:other');
    expect(reason(() => validateLoginWidget(params, BOT_TOKEN, options))).toBe('BAD_SIGNATURE');
  });

  it('rejects data signed the Mini App way', () => {
    // Mini App data uses a different key derivation; a hash made for one must not pass as the other.
    const params = login();
    params.set('hash', '0'.repeat(64));
    expect(reason(() => validateLoginWidget(params, BOT_TOKEN, options))).toBe('BAD_SIGNATURE');
  });

  it('rejects a changed field', () => {
    const params = login();
    params.set('id', '43');
    expect(reason(() => validateLoginWidget(params, BOT_TOKEN, options))).toBe('BAD_SIGNATURE');
  });

  it('rejects an added field', () => {
    const params = login();
    params.set('username', 'admin');
    expect(reason(() => validateLoginWidget(params, BOT_TOKEN, options))).toBe('BAD_SIGNATURE');
  });

  it('rejects a missing hash', () => {
    const params = login();
    params.delete('hash');
    expect(reason(() => validateLoginWidget(params, BOT_TOKEN, options))).toBe('MISSING_HASH');
  });

  it('rejects stale and future logins', () => {
    expect(reason(() => validateLoginWidget(login({ auth_date: String(NOW / 1000 - 7200) }), BOT_TOKEN, options))).toBe('EXPIRED');
    expect(reason(() => validateLoginWidget(login({ auth_date: String(NOW / 1000 + 600) }), BOT_TOKEN, options))).toBe('EXPIRED');
  });

  it('rejects a signed but malformed profile', () => {
    expect(reason(() => validateLoginWidget(login({ id: 'abc' }), BOT_TOKEN, options))).toBe('MALFORMED');
  });
});
