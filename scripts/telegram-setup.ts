// Registers the webhook, command list and menu button with Telegram.
// Safe to re-run after every deploy:  npm run telegram:setup
import { existsSync } from 'node:fs';
import { Api } from 'grammy';
import { BOT_COMMANDS, MENU_BUTTON_TEXT } from '../src/server/telegram/commands';

if (existsSync('.env')) process.loadEnvFile('.env');

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} in the environment or .env`);
  return value;
}

async function main() {
  const api = new Api(required('BOT_TOKEN'));
  const appUrl = new URL(required('NEXT_PUBLIC_APP_URL'));
  if (appUrl.protocol !== 'https:') throw new Error('NEXT_PUBLIC_APP_URL must be https for Telegram.');

  const webhookUrl = new URL('/api/bot', appUrl).toString();
  await api.setWebhook(webhookUrl, {
    secret_token: required('TELEGRAM_WEBHOOK_SECRET'),
    allowed_updates: ['message'],
    drop_pending_updates: process.argv.includes('--drop-pending'),
  });
  await api.setMyCommands(BOT_COMMANDS);
  await api.setChatMenuButton({
    menu_button: { type: 'web_app', text: MENU_BUTTON_TEXT, web_app: { url: new URL('/app', appUrl).toString() } },
  });

  const me = await api.getMe();
  const info = await api.getWebhookInfo();
  console.log(`@${me.username}: webhook -> ${info.url}`);
  if (info.last_error_message) console.warn(`Last delivery error: ${info.last_error_message}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
