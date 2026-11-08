import type { Metadata, Viewport } from 'next';
import { Geist_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { ThemeToggle } from '@/components/theme-toggle';
import { Toaster } from '@/components/ui/sonner';
import { geist } from '@/fonts/geist';
import { robotoFlex } from '@/fonts/roboto-flex';
import { siteName, siteUrl } from '@/lib/site';
import '../globals.css';

// Root layout for the website and client dashboard. The Telegram Mini App has its
// own root layout in (tma).

const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

// Decides before first paint whether the landing intro plays (see .landing-intro in globals.css).
// Lives here rather than in the page so it runs only on a full page load, never on client navigation.
const introScript = `try{var d=document.documentElement;if(location.pathname==='/'&&!sessionStorage.getItem('rc-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.dataset.intro='play';sessionStorage.setItem('rc-intro','1');setTimeout(function(){d.dataset.intro='done'},2400)}}catch(e){}`;

const description =
  'Training data you can trust. Real people label your data, and an answer is accepted only when evaluators reach consensus.';

// opengraph-image.tsx next to this file supplies og:image; X falls back to it for the large card.
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: 'RealCheck: training data you can trust', template: '%s · RealCheck' },
  description,
  applicationName: siteName,
  keywords: ['data labeling', 'data annotation', 'training data', 'human evaluation', 'consensus', 'AI datasets', 'Telegram', 'TON'],
  openGraph: {
    type: 'website',
    siteName,
    locale: 'en_US',
    title: 'RealCheck: training data you can trust',
    description: 'Labeled by people. Accepted only on consensus.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RealCheck: training data you can trust',
    description: 'Labeled by people. Accepted only on consensus.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={robotoFlex.variable} suppressHydrationWarning>
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
          <ThemeToggle />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
