import 'server-only';
import { Bot, GrammyError, HttpError, InlineKeyboard } from 'grammy';
import { formatMoney } from '@/lib/money';
import { prisma } from '@/server/db';
import { appUrl, requireEnv } from '@/server/env';
import { DATASET_START_PARAM } from '@/lib/telegram';

// One bot instance per server process. It is created lazily so the build doesn't
// need BOT_TOKEN, and reused across webhook calls so grammY only calls getMe once.

let bot: Bot | undefined;

function openAppKeyboard(path = '/app', label = 'Open RealCheck') {
  // Inline web_app buttons (unlike reply-keyboard ones) launch with signed user data.
  return new InlineKeyboard().webApp(label, appUrl(path));
}

function createBot() {
  const instance = new Bot(requireEnv('BOT_TOKEN'));

  instance.command('start', async (ctx) => {
    const match = DATASET_START_PARAM.exec(ctx.match ?? '');
    if (match) {
      await ctx.reply('Here is the task you were invited to:', {
        reply_markup: openAppKeyboard(`/app/tasks/${match[1]}`, 'Start labeling'),
      });
      return;
    }
    await ctx.reply(
      'Welcome to RealCheck!\n\nAnswer short labeling questions about text and images and get paid for every accepted answer.',
      { reply_markup: openAppKeyboard('/app', 'Start earning') },
    );
  });

  instance.command('balance', async (ctx) => {
    if (!ctx.from) return;
    const user = await prisma.user.findUnique({
      where: { telegramId: String(ctx.from.id) },
      select: { balanceCents: true, reputation: true, _count: { select: { votes: true } } },
    });
    if (!user) {
      await ctx.reply('You have not labeled anything yet.', { reply_markup: openAppKeyboard() });
      return;
    }
    await ctx.reply(
      `Balance: ${formatMoney(user.balanceCents)}\nAnswers: ${user._count.votes}\nReputation: ${user.reputation}`,
      { reply_markup: openAppKeyboard('/app', 'Keep earning') },
    );
  });

  instance.command('help', (ctx) =>
    ctx.reply(
      'How it works:\n' +
        '1. Open the app and pick a dataset.\n' +
        '2. Answer each question honestly. Some are check questions with known answers.\n' +
        '3. Every accepted answer adds to your balance. Low accuracy pauses new tasks.',
      { reply_markup: openAppKeyboard() },
    ),
  );

  instance.on('message', (ctx) =>
    ctx.reply('Tap the button below to open RealCheck.', { reply_markup: openAppKeyboard() }),
  );

  instance.catch(({ ctx, error }) => {
    const where = `update ${ctx.update.update_id}`;
    if (error instanceof GrammyError) console.error(`[bot] Telegram API error on ${where}:`, error.description);
    else if (error instanceof HttpError) console.error(`[bot] network error on ${where}:`, error);
    else console.error(`[bot] handler error on ${where}:`, error);
  });

  return instance;
}

export function getBot() {
  bot ??= createBot();
  return bot;
}
