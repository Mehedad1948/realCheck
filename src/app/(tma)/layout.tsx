import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';
import { TelegramProvider } from '@/features/tma/telegram-provider';
import '../globals.css';

// Root layout for the Telegram Mini App (/app). Separate from the website's root
// layout: no site chrome, Telegram's theme and viewport, React Query for the BFF.

export const metadata: Metadata = {
  title: 'RealCheck',
  description: 'Label data and get paid, right inside Telegram.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function TmaLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="tma" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        <QueryProvider>
          <TelegramProvider>
            <div className="tma-safe-area min-h-[var(--tg-viewport-stable-height,100dvh)] w-full">{children}</div>
            <Toaster position="top-center" />
          </TelegramProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
