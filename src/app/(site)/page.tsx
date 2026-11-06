import { ArrowRight, BadgeCheck, Coins, ScrollText, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { HeroTitle } from '@/components/site/hero-title';
import { LandingIntro } from '@/components/site/landing-intro';
import { Logo } from '@/components/site/logo';
import { SilkBackground } from '@/components/site/silk-background';
import { botUrl } from '@/lib/telegram';
import { getPlatformStats } from '@/server/queries/public';

const telegramUrl = botUrl(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME);

const steps = [
  { title: 'Upload', text: 'A CSV or JSON file and one question.' },
  { title: 'Label', text: 'Several people answer every item.' },
  { title: 'Export', text: 'Only the labels they agree on.' },
];

const principles = [
  { icon: BadgeCheck, label: 'Consensus voting' },
  { icon: ShieldCheck, label: 'Hidden check questions' },
  { icon: Coins, label: 'Pay per accepted answer' },
  { icon: ScrollText, label: 'Complete audit trail' },
];

export default function LandingPage() {
  return (
    // isolate keeps the background layers (-z-10) above the body but below all content.
    <div className="relative isolate min-h-screen text-foreground">
      <LandingIntro />
      {/* Silk fixed behind the whole page: a rounded panel that opens to full bleed on scroll, then dims
          behind the content further down (.hero-frame in globals.css). The glow is a fallback where
          WebGL is unavailable; the silk paints over it. Phones get a still image instead of either. */}
      <div aria-hidden className="hero-frame pointer-events-none inset-0 -z-10 overflow-hidden bg-muted/40 dark:bg-white/[0.02]">
        <div className="hero-glow absolute -top-50 left-1/2 h-130 w-225 -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <SilkBackground />
        <div className="hero-scrim absolute inset-0 bg-background" />
      </div>
      <div aria-hidden className="hero-frame-border pointer-events-none -z-10" />

      <header className="fixed inset-x-0 top-0 z-40">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <Logo />
          <div className="flex items-center gap-1 text-sm">
            <a href="#how" className="hidden px-3 py-2 text-muted-foreground transition-colors hover:text-foreground sm:block">
              How it works
            </a>
            {telegramUrl && (
              <a href={telegramUrl} className="hidden px-3 py-2 text-muted-foreground transition-colors hover:text-foreground sm:block">
                Earn
              </a>
            )}
            <Link href="/login" className="px-3 py-2 text-muted-foreground transition-colors hover:text-foreground">
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      {/* pt-22 clears the fixed header. */}
      <section className="hero-parallax relative flex min-h-svh flex-col pt-22">
        <div className="hero-legible mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
          <HeroTitle className="landing-rise text-[clamp(2.75rem,7vw,5.75rem)] leading-[1.02] tracking-[-0.03em]" />
          <p className="landing-rise mt-7 text-base text-foreground/85 [--rise-delay:150ms] md:text-lg">
            Labeled by people. Accepted only on consensus.
          </p>
          <div className="landing-rise mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 [--rise-delay:300ms]">
            <Link
              href="/register"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 font-medium text-background [text-shadow:none] transition-opacity hover:opacity-90"
            >
              Start a dataset
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            {telegramUrl && (
              <a href={telegramUrl} className="text-sm font-medium text-foreground/85 transition-colors hover:text-foreground">
                Earn on Telegram →
              </a>
            )}
          </div>
        </div>

        <div className="hero-legible landing-rise mx-auto flex w-full max-w-6xl justify-center px-6 pb-10 [--rise-delay:500ms]">
          <Suspense fallback={<div className="h-13" />}>
            <PlatformStats />
          </Suspense>
        </div>
      </section>

      <main>
        {/* A plain box shaped like the hero panel that rises over the hero (.content-frame in globals.css). */}
        <div id="how" className="content-frame">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-16 md:gap-20 md:px-10">
            <section>
              <h2 className="text-sm text-muted-foreground">How it works</h2>
              <ol className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
                {steps.map((step, i) => (
                  <li key={step.title} className="border-t border-border pt-6">
                    <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                    <h3 className="mt-6 text-3xl font-medium tracking-tight">{step.title}</h3>
                    <p className="mt-2 text-muted-foreground">{step.text}</p>
                  </li>
                ))}
              </ol>
            </section>

            <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
              {principles.map((item) => (
                <li key={item.label} className="flex flex-col gap-6 bg-background/85 p-6">
                  <item.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  <span className="text-sm font-medium">{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section className="relative isolate overflow-hidden border-t border-border py-40 text-center">
          <div aria-hidden className="absolute -bottom-75 left-1/2 -z-10 h-125 w-200 -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
          <h2 className="mx-auto max-w-3xl px-6 text-5xl font-medium tracking-[-0.04em] md:text-6xl">Start with one file.</h2>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 px-6">
            <Link
              href="/register"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 font-medium text-background transition-opacity hover:opacity-90"
            >
              Create a free account <ArrowRight className="h-4 w-4" />
            </Link>
            {telegramUrl && (
              <a href={telegramUrl} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Or earn on Telegram →
              </a>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8 text-sm text-muted-foreground">
          <Logo className="text-foreground" />
          <p>© RealCheck</p>
        </div>
      </footer>
    </div>
  );
}

// Cached for hours and shared by every visitor. Read at request time rather than during the build,
// so deploying never depends on the database; if it is unreachable the stats are simply hidden.
async function PlatformStats() {
  await connection();
  const stats = await getPlatformStats().catch((error: unknown) => {
    console.error('Failed to load platform stats', error);
    return null;
  });
  if (!stats) return null;
  const items = [
    { label: 'Live datasets', value: stats.activeDatasets },
    { label: 'Labels collected', value: stats.labels },
    { label: 'Evaluators', value: stats.evaluators },
  ];
  return (
    <dl className="flex gap-10 text-sm">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col-reverse items-center">
          <dt className="text-foreground/75">{item.label}</dt>
          <dd className="text-lg font-medium tabular-nums">{item.value.toLocaleString('en-US')}</dd>
        </div>
      ))}
    </dl>
  );
}
