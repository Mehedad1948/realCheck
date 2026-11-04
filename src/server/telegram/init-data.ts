import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

// Validation of Telegram Mini App launch data, as specified in
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//
// Kept free of Next.js and database imports so it can be unit tested.

export const telegramUserSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
  language_code: z.string().optional(),
  is_premium: z.boolean().optional(),
  allows_write_to_pm: z.boolean().optional(),
  photo_url: z.string().optional(),
});
export type TelegramUser = z.infer<typeof telegramUserSchema>;

export type InitData = {
  user: TelegramUser;
  authDate: Date;
  startParam?: string;
  queryId?: string;
};

export type InitDataFailure = 'MALFORMED' | 'MISSING_HASH' | 'BAD_SIGNATURE' | 'EXPIRED';

export class InitDataError extends Error {
  constructor(readonly reason: InitDataFailure) {
    super(`Invalid Telegram init data: ${reason}`);
    this.name = 'InitDataError';
  }
}

/** Clock skew tolerated for an auth_date that is slightly in the future. */
const FUTURE_SKEW_SECONDS = 60;

function dataCheckString(params: URLSearchParams) {
  return [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

function sign(params: URLSearchParams, botToken: string) {
  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  return createHmac('sha256', secret).update(dataCheckString(params)).digest('hex');
}

export function validateInitData(
  raw: string,
  botToken: string,
  { maxAgeSeconds, now = Date.now() }: { maxAgeSeconds: number; now?: number },
): InitData {
  const params = new URLSearchParams(raw);
  const hash = params.get('hash');
  if (!hash) throw new InitDataError('MISSING_HASH');

  const expected = Buffer.from(sign(params, botToken), 'hex');
  const received = Buffer.from(hash, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new InitDataError('BAD_SIGNATURE');
  }

  const authDateSeconds = Number(params.get('auth_date'));
  if (!Number.isInteger(authDateSeconds) || authDateSeconds <= 0) throw new InitDataError('MALFORMED');
  const ageSeconds = now / 1000 - authDateSeconds;
  if (ageSeconds > maxAgeSeconds || ageSeconds < -FUTURE_SKEW_SECONDS) {
    throw new InitDataError('EXPIRED');
  }

  let user: TelegramUser;
  try {
    user = telegramUserSchema.parse(JSON.parse(params.get('user') ?? ''));
  } catch {
    throw new InitDataError('MALFORMED');
  }

  return {
    user,
    authDate: new Date(authDateSeconds * 1000),
    startParam: params.get('start_param') ?? undefined,
    queryId: params.get('query_id') ?? undefined,
  };
}

/** Produces initData signed like Telegram does. Used by tests and local tooling. */
export function signInitData(fields: Record<string, string>, botToken: string) {
  const params = new URLSearchParams(fields);
  params.set('hash', sign(params, botToken));
  return params.toString();
}
