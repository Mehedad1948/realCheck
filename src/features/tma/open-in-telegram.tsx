import { Send } from 'lucide-react';
import { botUrl } from '@/lib/telegram';
import { IconTile, Surface } from './ui';

export function OpenInTelegram({ startParam }: { startParam?: string }) {
  const href = botUrl(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME, startParam);
  return (
    <Surface className="p-6">
      <IconTile className="h-11 w-11 rounded-full">
        <Send className="-translate-x-px translate-y-px" />
      </IconTile>
      <p className="mt-4 text-[24px] leading-tight font-[300] tracking-[-0.03em]">Open RealCheck in Telegram</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Your account, answers and earnings live in Telegram. You can browse open datasets here.
      </p>
      {href && (
        <a
          href={href}
          className="mt-5 flex h-12 items-center justify-center rounded-full bg-foreground text-[15px] font-medium text-background"
        >
          Open in Telegram
        </a>
      )}
    </Surface>
  );
}
