import { timingSafeEqual } from 'node:crypto';
import { webhookCallback } from 'grammy';
import { requireEnv } from '@/server/env';
import { getBot } from '@/server/telegram/bot';

// Telegram webhook. Register it with `npm run telegram:setup`.

let handler: ((request: Request) => Promise<Response>) | undefined;

function hasValidSecret(request: Request, secret: string) {
  const received = Buffer.from(request.headers.get('x-telegram-bot-api-secret-token') ?? '');
  const expected = Buffer.from(secret);
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export async function POST(request: Request) {
  const secret = requireEnv('TELEGRAM_WEBHOOK_SECRET');
  // Checked here, before grammY: its own check runs only after `bot.init()`, which
  // would make every unauthenticated request trigger a call to the Telegram API.
  if (!hasValidSecret(request, secret)) {
    return new Response('Unauthorized', { status: 401 });
  }
  handler ??= webhookCallback(getBot(), 'std/http', { secretToken: secret });
  return handler(request);
}
