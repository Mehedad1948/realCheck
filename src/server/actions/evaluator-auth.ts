'use server';

import { redirect } from 'next/navigation';
import { createSession, deleteSession } from '@/server/auth/session';
import { DEV_USER, upsertWebEvaluator } from '@/server/auth/tma';
import { isDevMockAllowed } from '@/server/env';

// Website sign-in for evaluators happens in /api/auth/telegram (the Login Widget redirects there).
// These cover the rest: the development shortcut and signing out.

/** Telegram's widget refuses localhost, so development signs in as the Mini App's mock user. */
export async function devEvaluatorLoginAction() {
  if (!isDevMockAllowed()) redirect('/earn/login?error=unavailable');
  const account = await upsertWebEvaluator(DEV_USER);
  await createSession({ userId: account.id, role: 'EVALUATOR' });
  redirect('/earn');
}

export async function evaluatorLogoutAction() {
  await deleteSession();
  redirect('/earn/login');
}
