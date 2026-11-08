import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/sonner';
import { manrope } from '@/fonts/manrope';
import { robotoFlex } from '@/fonts/roboto-flex';
import { TelegramProvider } from '@/features/tma/telegram-provider';
import { siteName, siteUrl } from '@/lib/site';
import '../globals.css';

// Root layout for the Telegram Mini App (/app). Separate from the website's root
// layout: no site chrome, Telegram's viewport, React Query for the BFF. Manrope for text, Roboto Flex
// for headlines and figures, as on the landing page.

// app/opengraph-image.tsx supplies og:image for links to the Mini App shared in chats.
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: siteName,
  description: 'Label data and get paid, right inside Telegram.',
  applicationName: siteName,
  openGraph: {
    type: 'website',
    siteName,
    title: 'RealCheck for Telegram',
    description: 'Label data and get paid, right inside Telegram.',
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// Picks light or dark before first paint, so the app never flashes the wrong theme while
// telegram-web-app.js and React load. Telegram passes its theme in the launch URL's hash (and its script
// keeps a copy in sessionStorage for later navigations); dark is decided from the background color the
// same way Telegram decides colorScheme. Outside Telegram it follows the OS. The page is dark until then.
const themeScript = `try{var d=document.documentElement,p=new URLSearchParams(location.hash.slice(1)).get('tgWebAppThemeParams')||sessionStorage.getItem('__telegram__themeParams'),b=p&&JSON.parse(p).bg_color,k;if(b&&/^#[0-9a-f]{6}$/i.test(b)){var r=parseInt(b.slice(1,3),16),g=parseInt(b.slice(3,5),16),l=parseInt(b.slice(5,7),16);k=Math.sqrt(.299*r*r+.587*g*g+.114*l*l)<120}else{k=matchMedia('(prefers-color-scheme: dark)').matches}d.classList.toggle('dark',k);d.style.colorScheme=k?'dark':'light'}catch(e){}`;

export default function TmaLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`tma dark ${robotoFlex.variable} ${manrope.variable}`} style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
