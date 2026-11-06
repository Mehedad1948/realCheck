import 'server-only';
import { z } from 'zod';

// Validated lazily so `next build` doesn't need runtime-only secrets such as BOT_TOKEN.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),

  /** Public origin of this deployment, e.g. https://realcheck.example.com */
  NEXT_PUBLIC_APP_URL: z.url().optional(),

  BOT_TOKEN: z.string().min(1).optional(),
  /** Sent by Telegram in X-Telegram-Bot-Api-Secret-Token on every webhook call. */
  TELEGRAM_WEBHOOK_SECRET: z
    .string()
    .regex(/^[A-Za-z0-9_-]{16,256}$/, 'Use 16-256 characters: A-Z, a-z, 0-9, _ and -')
    .optional(),
  NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: z.string().optional(),
  /** How long a Mini App launch (initData) stays valid, in seconds. */
  TMA_INIT_DATA_MAX_AGE: z.coerce.number().int().positive().default(60 * 60 * 24),
  /** Lets the Mini App run in a normal browser during development. Ignored in production. */
  NEXT_PUBLIC_TMA_DEV_MOCK: z.stringbool().default(false),

  /** TON network evaluator wallets must be on. Use testnet while trying out payouts. */
  TON_NETWORK: z.enum(['mainnet', 'testnet']).default('mainnet'),

  /** Top-ups credit balance without a payment provider. Only for demos and staging. */
  ENABLE_DEMO_TOP_UP: z.stringbool().default(false),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      throw new Error(`Invalid environment variables:\n${z.prettifyError(parsed.error)}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export function requireEnv<K extends keyof Env>(key: K): NonNullable<Env[K]> {
  const value = env()[key];
  if (value === undefined || value === null || value === '') {
    throw new Error(`Missing required environment variable ${key}`);
  }
  return value as NonNullable<Env[K]>;
}

export function isDevMockAllowed() {
  const e = env();
  return e.NEXT_PUBLIC_TMA_DEV_MOCK && e.NODE_ENV !== 'production';
}

export function appUrl(path = '') {
  return new URL(path, requireEnv('NEXT_PUBLIC_APP_URL')).toString();
}
