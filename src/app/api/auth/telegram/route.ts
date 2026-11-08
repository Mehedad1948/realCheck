import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { createSession } from '@/server/auth/session';
import { upsertWebEvaluator } from '@/server/auth/tma';
import { env } from '@/server/env';
import { LoginWidgetError, validateLoginWidget } from '@/server/telegram/login-widget';

/** A login link from the widget is used right away; an old one is likely copied from somewhere. */
const LOGIN_MAX_AGE_SECONDS = 60 * 60;

/**
 * Where the Telegram Login Widget sends the evaluator after they confirm (its data-auth-url).
 * Verifies Telegram's signature, then starts an ordinary web session for the same account the
 * Mini App uses.
 */
export async function GET(request: NextRequest) {
  const botToken = env().BOT_TOKEN;
  if (!botToken) redirect('/earn/login?error=unavailable');

  let failure: string | null = null;
  try {
    const user = validateLoginWidget(request.nextUrl.searchParams, botToken, { maxAgeSeconds: LOGIN_MAX_AGE_SECONDS });
    const account = await upsertWebEvaluator(user);
    if (account.role !== 'EVALUATOR') failure = 'not-evaluator';
    else await createSession({ userId: account.id, role: 'EVALUATOR' });
  } catch (error) {
    if (!(error instanceof LoginWidgetError)) {
      console.error('[auth] Telegram sign-in failed', error);
      failure = 'server';
    } else {
      failure = error.reason === 'EXPIRED' ? 'expired' : 'invalid';
    }
  }

  // Outside the try: redirect() works by throwing.
  redirect(failure ? `/earn/login?error=${failure}` : '/earn');
}
