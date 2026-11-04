import { Send } from 'lucide-react';
import { botUrl } from '@/lib/telegram';

export function OpenInTelegram({ startParam }: { startParam?: string }) {
  const href = botUrl(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME, startParam);
  return (
    <div className="rounded-2xl bg-card p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-500 text-white">
        <Send className="h-5 w-5 -translate-x-px translate-y-px" />
      </div>
      <p className="mt-3 text-[17px] font-semibold">Open RealCheck in Telegram</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Your account, answers and earnings live in Telegram. You can browse open datasets here.
      </p>
      {href && (
        <a
          href={href}
          className="mt-4 flex h-11 items-center justify-center rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground"
        >
          Open in Telegram
        </a>
      )}
    </div>
  );
}
