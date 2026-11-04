import { ArrowRight, BadgeCheck, Coins, FileUp, ListChecks, ScrollText, Send, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { Logo } from '@/components/site/logo';
import { botUrl } from '@/lib/telegram';
import { getPlatformStats } from '@/server/queries/public';

const telegramUrl = botUrl(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME);

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[720px]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--foreground)_5%,transparent)_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_40%,transparent_100%)] bg-[size:56px_56px]" />
        <div className="absolute top-[-200px] left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      </div>

      <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-1 text-sm">
          <a href="#how" className="hidden rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground sm:block">
            How it works
          </a>
          <a href="#evaluators" className="hidden rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground sm:block">
            Earn
          </a>
          <Link href="/login" className="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Link href="/register" className="ml-2 rounded-full bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-90">
            Get started
          </Link>
        </div>
      </nav>

      <main className="relative z-10">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-16 px-6 pt-16 pb-24 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-[13px] text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              Human-verified data labeling
            </span>
            <h1 className="mt-6 text-5xl leading-[1.05] font-semibold tracking-tight text-balance md:text-6xl">
              Training data you can{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-primary to-violet-500 bg-clip-text text-transparent">actually trust.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Upload text or images, and thousands of evaluators on Telegram label them. Every item is answered by several
              people and accepted only when they agree, with hidden check questions keeping quality honest.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 font-medium text-primary-foreground shadow-lg shadow-primary/25 transition hover:brightness-110"
              >
                Start a dataset
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              {telegramUrl && (
                <a
                  href={telegramUrl}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card/60 px-6 font-medium backdrop-blur transition-colors hover:bg-accent"
                >
                  <Send className="h-4 w-4" />
                  Earn on Telegram
                </a>
              )}
            </div>
            <Suspense fallback={<div className="mt-14 h-[60px]" />}>
              <PlatformStats />
            </Suspense>
          </div>

          <HeroMock />
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-border bg-card/30 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading eyebrow="How it works" title="From raw rows to verified labels in three steps" />
            <ol className="mt-14 grid gap-6 md:grid-cols-3">
              {[
                { icon: FileUp, title: 'Upload your data', text: 'Drop in a CSV or JSON file of texts or image URLs and define one clear question with answer options.' },
                { icon: Users, title: 'Evaluators answer', text: 'Items go to evaluators in Telegram. Each one is answered by several people independently.' },
                { icon: ListChecks, title: 'Export consensus', text: 'Download the agreed label, agreement score and vote breakdown for every item as CSV or JSON.' },
              ].map((step, i) => (
                <li key={step.title} className="relative rounded-2xl border border-border bg-card p-7">
                  <span className="absolute top-7 right-7 font-mono text-sm text-muted-foreground/60">0{i + 1}</span>
                  <step.icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Quality */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <SectionHeading eyebrow="Quality, built in" title="Designed so careless answers don’t make it into your data" />
            <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
              {[
                { icon: BadgeCheck, title: 'Consensus voting', text: 'An item is labeled only when the required number of evaluators have answered. Ties are flagged, never guessed.' },
                { icon: ShieldCheck, title: 'Hidden check questions', text: 'Mix in items with known answers. Evaluators who miss them lose reputation and stop receiving work.' },
                { icon: Coins, title: 'Pay per accepted answer', text: 'You fund a balance and are charged only for answers you receive. No subscriptions, no minimums.' },
                { icon: ScrollText, title: 'Complete audit trail', text: 'Every vote and every cent is recorded in an append-only ledger you can reconcile at any time.' },
              ].map((feature) => (
                <div key={feature.title} className="bg-background p-8">
                  <feature.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Evaluators */}
        <section id="evaluators" className="px-6 pb-24">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-600 px-8 py-14 text-white md:px-14">
            <div aria-hidden className="absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="relative grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
              <div>
                <p className="text-sm font-medium text-white/80">For evaluators</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Earn from your phone, a minute at a time.</h2>
                <p className="mt-4 max-w-lg text-white/85">
                  Open RealCheck in Telegram, answer quick questions about texts and images, and get paid for every accepted
                  answer. No sign-up forms.
                </p>
              </div>
              {telegramUrl && (
                <a
                  href={telegramUrl}
                  className="inline-flex h-12 items-center justify-center gap-2 justify-self-start rounded-full bg-white px-6 font-semibold text-indigo-700 shadow-xl transition hover:bg-white/90 md:justify-self-end"
                >
                  <Send className="h-4 w-4" />
                  Open in Telegram
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border py-24 text-center">
          <div className="mx-auto max-w-2xl px-6">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Ready to label your first dataset?</h2>
            <p className="mt-4 text-muted-foreground">Create an account, upload a file and see labels come in within minutes.</p>
            <Link
              href="/register"
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 font-medium text-background transition-opacity hover:opacity-90"
            >
              Create a free account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo className="text-foreground" />
          <p>© RealCheck. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-balance md:text-4xl">{title}</h2>
    </div>
  );
}

// Cached for hours and shared by every visitor, so the page stays effectively static.
async function PlatformStats() {
  const stats = await getPlatformStats();
  const items = [
    { label: 'Live datasets', value: stats.activeDatasets },
    { label: 'Labels collected', value: stats.labels },
    { label: 'Evaluators', value: stats.evaluators },
  ];
  return (
    <dl className="mt-14 flex gap-10">
      {items.map((item) => (
        <div key={item.label}>
          <dd className="text-2xl font-semibold tracking-tight tabular-nums">{item.value.toLocaleString('en-US')}</dd>
          <dt className="mt-0.5 text-[13px] text-muted-foreground">{item.label}</dt>
        </div>
      ))}
    </dl>
  );
}

/** A static rendering of the Mini App task screen, to show what evaluators see. */
function HeroMock() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-sm select-none">
      <div className="absolute -inset-6 rounded-[44px] bg-gradient-to-b from-primary/25 to-transparent blur-2xl" />
      <div className="relative rounded-[36px] border border-border bg-[#f2f2f7] p-3 shadow-2xl dark:bg-black">
        <div className="rounded-[28px] bg-[#f2f2f7] px-4 pt-5 pb-6 text-black dark:bg-black dark:text-white">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-zinc-500">3 of 10</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">+$0.15</span>
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i < 2 ? 'bg-[#2481cc]' : i === 2 ? 'bg-[#2481cc]/40' : 'bg-black/10 dark:bg-white/15'}`} />
            ))}
          </div>
          <p className="mt-5 text-[12px] text-zinc-500">Shoe review sentiment</p>
          <p className="mt-1 text-[17px] leading-snug font-semibold">How does this customer feel?</p>
          <div className="mt-4 rounded-2xl bg-white px-4 py-4 text-[15px] leading-relaxed dark:bg-[#1c1c1e]">
            “Best purchase this year. I already ordered a second pair.”
          </div>
          <div className="mt-3 space-y-2">
            {['Positive', 'Negative', 'Neutral'].map((option, i) => (
              <div
                key={option}
                className={`flex h-11 items-center gap-3 rounded-2xl px-3 text-[15px] font-medium ${i === 0 ? 'bg-[#2481cc] text-white' : 'bg-white dark:bg-[#1c1c1e]'}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${i === 0 ? 'bg-white/20' : 'bg-black/5 text-zinc-500 dark:bg-white/10'}`}>
                  {i === 0 ? '✓' : i + 1}
                </span>
                {option}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-10 hidden rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-xl backdrop-blur sm:block">
        <p className="text-[11px] text-muted-foreground">Consensus reached</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
          <BadgeCheck className="h-4 w-4 text-success" /> Positive · 100%
        </p>
      </div>
    </div>
  );
}
