import { Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { botUrl } from '@/lib/telegram';

export function OpenInTelegram({ startParam }: { startParam?: string }) {
  const href = botUrl(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME, startParam);
  return (
    <Card>
      <CardContent className="flex flex-col items-start gap-3">
        <p className="font-semibold">Open RealCheck in Telegram to start earning</p>
        <p className="text-sm text-muted-foreground">
          Your account, answers and balance live in the Telegram app. You can browse open datasets here.
        </p>
        {href && (
          <a
            href={href}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Send className="h-4 w-4" /> Open in Telegram
          </a>
        )}
      </CardContent>
    </Card>
  );
}
