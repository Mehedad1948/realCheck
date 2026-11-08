import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

// Validation of Telegram Login Widget data, as specified in
// https://core.telegram.org/widgets/login#checking-authorization
//
// Same idea as Mini App launch data (init-data.ts), but the fields arrive flat rather than as a JSON
// `user`, and the HMAC key is SHA-256 of the bot token instead of an HMAC of it.
// Kept free of Next.js and database imports so it can be unit tested.

export const loginWidgetUserSchema = z.object({
  id: z.coerce.number().int().positive(),
  first_name: z.string().min(1),
  last_name: z.string().optional(),
  username: z.string().optional(),
  photo_url: z.string().optional(),
});
export type LoginWidgetUser = z.infer<typeof loginWidgetUserSchema>;

export type LoginWidgetFailure = 'MALFORMED' | 'MISSING_HASH' | 'BAD_SIGNATURE' | 'EXPIRED';

export class LoginWidgetError extends Error {
  constructor(readonly reason: LoginWidgetFailure) {
    super(`Invalid Telegram login data: ${reason}`);
    this.name = 'LoginWidgetError';
  }
}

/** The profile fields read from a verified login. */
const PROFILE_FIELDS = ['id', 'first_name', 'last_name', 'username', 'photo_url'] as const;
const FUTURE_SKEW_SECONDS = 60;

// Telegram signs every field it sends, so all of them go into the check string.
function dataCheckString(params: URLSearchParams) {
  return [...params.entries()]
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

function sign(params: URLSearchParams, botToken: string) {
  const secret = createHash('sha256').update(botToken).digest();
  return createHmac('sha256', secret).update(dataCheckString(params)).digest('hex');
}

export function validateLoginWidget(
  params: URLSearchParams,
  botToken: string,
  { maxAgeSeconds, now = Date.now() }: { maxAgeSeconds: number; now?: number },
): LoginWidgetUser {
  const hash = params.get('hash');
  if (!hash) throw new LoginWidgetError('MISSING_HASH');

  const expected = Buffer.from(sign(params, botToken), 'hex');
  const received = Buffer.from(hash, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new LoginWidgetError('BAD_SIGNATURE');
  }

  const authDateSeconds = Number(params.get('auth_date'));
  if (!Number.isInteger(authDateSeconds) || authDateSeconds <= 0) throw new LoginWidgetError('MALFORMED');
  const ageSeconds = now / 1000 - authDateSeconds;
  if (ageSeconds > maxAgeSeconds || ageSeconds < -FUTURE_SKEW_SECONDS) throw new LoginWidgetError('EXPIRED');

  const fields = PROFILE_FIELDS.flatMap((key) => (params.has(key) ? [[key, params.get(key)]] : []));
  const user = loginWidgetUserSchema.safeParse(Object.fromEntries(fields));
  if (!user.success) throw new LoginWidgetError('MALFORMED');
  return user.data;
}

/** Produces login data signed like Telegram does. Used by tests and local tooling. */
export function signLoginWidget(fields: Record<string, string>, botToken: string) {
  const params = new URLSearchParams(fields);
  params.set('hash', sign(params, botToken));
  return params;
}
