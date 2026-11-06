import 'server-only';
import { prisma } from '@/server/db';
import { env, isDevMockAllowed, requireEnv } from '@/server/env';
import { errors, isUniqueViolation } from '@/server/errors';
import { InitDataError, validateInitData, type InitData, type TelegramUser } from '@/server/telegram/init-data';

// Authentication for Mini App requests.
//
// The client sends the raw launch data on every call as `Authorization: tma <initData>`.
// A header is used rather than a cookie because Telegram Web runs the Mini App in a
// cross-site iframe, where cookies are unreliable. Checking the HMAC on each request
// is cheap and needs no server-side session state.

const DEV_USER: TelegramUser = { id: 1_000_001, first_name: 'Dev', username: 'dev_evaluator' };
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
 * Authenticates a Mini App request and returns the evaluator.
 * Pass `refreshProfile` from the session bootstrap call to sync name, photo, etc.
 */
export async function requireEvaluator(request: Request, options = { refreshProfile: false }) {
  const initData = authenticateInitData(request);
  const evaluator = await findOrCreateEvaluator(initData.user, options);
  if (evaluator.role !== 'EVALUATOR') {
    throw errors.forbidden('This Telegram account is linked to a non-evaluator account.');
  }
  return { evaluator, initData };
}
