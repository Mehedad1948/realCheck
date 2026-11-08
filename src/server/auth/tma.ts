import 'server-only';
import { prisma } from '@/server/db';
import { env, isDevMockAllowed, requireEnv } from '@/server/env';
import { errors, isUniqueViolation } from '@/server/errors';
import { InitDataError, validateInitData, type InitData, type TelegramUser } from '@/server/telegram/init-data';
import type { LoginWidgetUser } from '@/server/telegram/login-widget';
import { readSession } from './session';

// Authentication for evaluator requests, from either of the two places evaluators work.
//
// Mini App: the client sends the raw launch data on every call as `Authorization: tma <initData>`.
// A header is used rather than a cookie because Telegram Web runs the Mini App in a
// cross-site iframe, where cookies are unreliable. Checking the HMAC on each request
// is cheap and needs no server-side session state.
//
// Website (/earn): the evaluator signed in with the Telegram Login Widget, which set the usual
// session cookie with the EVALUATOR role. Both resolve to the same user through telegramId, so
// balance, reputation and history are shared between the two.

export const DEV_USER: TelegramUser = { id: 1_000_001, first_name: 'Dev', username: 'dev_evaluator' };
const DEV_TOKEN = 'dev';

export function authenticateInitData(request: Request): InitData {
  const header = request.headers.get('authorization') ?? '';
  const [scheme, ...rest] = header.split(' ');
  const raw = rest.join(' ').trim();
  if (scheme?.toLowerCase() !== 'tma' || !raw) {
    throw errors.unauthorized('Open RealCheck from Telegram to continue.');
  }

  if (raw === DEV_TOKEN) {
    if (!isDevMockAllowed()) throw errors.unauthorized('Development login is disabled.');
    return { user: DEV_USER, authDate: new Date() };
  }

  try {
    return validateInitData(raw, requireEnv('BOT_TOKEN'), { maxAgeSeconds: env().TMA_INIT_DATA_MAX_AGE });
  } catch (error) {
    if (error instanceof InitDataError) {
      throw error.reason === 'EXPIRED'
        ? errors.unauthorized('Your session expired. Close and reopen the app.')
        : errors.unauthorized('Could not verify your Telegram session.');
    }
    throw error;
  }
}

function profileFields(user: TelegramUser) {
  return {
    username: user.username ?? null,
    firstName: user.first_name,
    lastName: user.last_name ?? null,
    languageCode: user.language_code ?? null,
    photoUrl: user.photo_url ?? null,
    isPremium: user.is_premium ?? false,
    allowsWriteToPm: user.allows_write_to_pm ?? false,
  };
}

const evaluatorSelect = {
  id: true,
  role: true,
  balanceCents: true,
  trust: true,
  goldAnswered: true,
  lastGoldCorrect: true,
} as const;

/** Finds the evaluator for this Telegram user, creating the account on first contact. */
async function findOrCreateEvaluator(user: TelegramUser, { refreshProfile }: { refreshProfile: boolean }) {
  const telegramId = String(user.id);

  if (!refreshProfile) {
    const existing = await prisma.user.findUnique({ where: { telegramId }, select: evaluatorSelect });
    if (existing) return existing;
  }

  const data = { ...profileFields(user), lastSeenAt: new Date() };
  try {
    return await prisma.user.upsert({
      where: { telegramId },
      update: data,
      create: { telegramId, role: 'EVALUATOR', ...data },
      select: evaluatorSelect,
    });
  } catch (error) {
    // Two first requests raced to create the user; the other one won.
    if (isUniqueViolation(error)) {
      return prisma.user.findUniqueOrThrow({ where: { telegramId }, select: evaluatorSelect });
    }
    throw error;
  }
}

export type Evaluator = Awaited<ReturnType<typeof findOrCreateEvaluator>>;

/**
 * Authenticates an evaluator request, from the Mini App or the website, and returns the evaluator.
 * Pass `refreshProfile` from the Mini App's session bootstrap call to sync name, photo, etc.
 */
export async function requireEvaluator(request: Request, options = { refreshProfile: false }) {
  if (!request.headers.has('authorization')) return { evaluator: await evaluatorFromSession(request) };

  const initData = authenticateInitData(request);
  const evaluator = await findOrCreateEvaluator(initData.user, options);
  if (evaluator.role !== 'EVALUATOR') {
    throw errors.forbidden('This Telegram account is linked to a non-evaluator account.');
  }
  return { evaluator };
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

async function evaluatorFromSession(request: Request) {
  const session = await readSession();
  if (!session) throw errors.unauthorized('Sign in with Telegram to continue.');
  if (session.role !== 'EVALUATOR') throw errors.forbidden('Sign in with Telegram to label tasks.');

  // The cookie rides along on any request to this site, so writes must come from its own pages.
  // SameSite=Lax already covers most of this; the Origin check covers the rest.
  if (!SAFE_METHODS.has(request.method) && request.headers.get('origin') !== new URL(request.url).origin) {
    throw errors.forbidden('Cross-site request refused.');
  }

  const evaluator = await prisma.user.findUnique({ where: { id: session.userId }, select: evaluatorSelect });
  if (!evaluator || evaluator.role !== 'EVALUATOR') throw errors.unauthorized('Sign in with Telegram to continue.');
  return evaluator;
}

/**
 * Finds or creates the evaluator behind a website sign-in. Only the fields the Login Widget
 * provides are written, so the Mini App's language and messaging consent are kept.
 */
export async function upsertWebEvaluator(user: LoginWidgetUser) {
  const telegramId = String(user.id);
  const data = {
    username: user.username ?? null,
    firstName: user.first_name,
    lastName: user.last_name ?? null,
    photoUrl: user.photo_url ?? null,
    lastSeenAt: new Date(),
  };
  const select = { id: true, role: true } as const;
  try {
    return await prisma.user.upsert({ where: { telegramId }, update: data, create: { telegramId, role: 'EVALUATOR', ...data }, select });
  } catch (error) {
    if (isUniqueViolation(error)) return prisma.user.findUniqueOrThrow({ where: { telegramId }, select });
    throw error;
  }
}
