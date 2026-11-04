// Shared by the bot and `scripts/telegram-setup.ts`, so the command menu users see
// always matches what the bot handles.
export const BOT_COMMANDS = [
  { command: 'start', description: 'Open RealCheck and start earning' },
  { command: 'balance', description: 'Show your balance and accuracy' },
  { command: 'help', description: 'How RealCheck works' },
] as const;

export const MENU_BUTTON_TEXT = 'Earn';
