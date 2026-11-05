import type { Metadata } from 'next';
import { Geist_Mono } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { ThemeToggle } from '@/components/theme-toggle';
import { Toaster } from '@/components/ui/sonner';
import '../globals.css';

// Root layout for the website and client dashboard. The Telegram Mini App has its
// own root layout in (tma).

const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

// Decides before first paint whether the landing intro plays (see .landing-intro in globals.css).
// Lives here rather than in the page so it runs only on a full page load, never on client navigation.
const introScript = `try{var d=document.documentElement;if(location.pathname==='/'&&!sessionStorage.getItem('rc-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.dataset.intro='play';sessionStorage.setItem('rc-intro','1');setTimeout(function(){d.dataset.intro='done'},2400)}}catch(e){}`;

export const metadata: Metadata = {
  title: { default: 'RealCheck', template: '%s · RealCheck' },
  description: 'Data labeling, verified by consensus.',
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistMono.variable} font-sans antialiased`}>
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
