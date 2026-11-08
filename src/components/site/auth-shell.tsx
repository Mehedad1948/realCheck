import { BadgeCheck, Coins, ShieldCheck, type LucideIcon } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Logo } from './logo';
import { SilkBackground } from './silk-background';

export type Pitch = { headline: string; points: { icon: LucideIcon; text: string }[] };

const clientPitch: Pitch = {
  headline: 'Labels you can ship to production.',
  points: [
    { icon: BadgeCheck, text: 'Every label confirmed by several independent evaluators' },
    { icon: ShieldCheck, text: 'Hidden check questions keep accuracy high' },
    { icon: Coins, text: 'Pay only for answers you receive' },
  ],
};

/** Sign-in and sign-up frame. The side panel pitches to clients unless another `pitch` is given. */
export function AuthShell({
  title,
  description,
  children,
  footer,
  pitch = clientPitch,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  pitch?: Pitch;
}) {
  return (
    // isolate keeps the background layers (-z-10) above the body but below all content.
    <div className="relative isolate flex min-h-svh flex-col">
      {/* Silk fixed behind the page, as on the landing page: the live shader on desktop, a still frame on
          phones (.silk-still). The glow is the fallback where WebGL is unavailable. The scrim fades the
          silk out under the form so it stays legible; on phones it is a top-to-bottom fade instead. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-muted/40 dark:bg-white/2">
        <div className="hero-glow absolute -top-40 -left-40 h-130 w-130 rounded-full bg-primary/25 blur-[120px]" />
        <SilkBackground />
        <div className="absolute inset-0 bg-linear-to-b from-background/20 via-background/60 to-background lg:bg-linear-to-r lg:from-transparent lg:via-background/30 lg:to-background/85" />
      </div>

      <header className="mx-auto w-full max-w-6xl px-6 pt-6 lg:pt-8">
        <Logo className="auth-rise" />
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-20 lg:py-12">
        <aside className="hidden lg:block">
          <h2
            className="auth-rise max-w-md text-5xl leading-[1.05] font-semibold tracking-tight text-balance"
            style={{ '--rise-delay': '80ms' } as CSSProperties}
          >
            {pitch.headline}
          </h2>
          <ul className="mt-10 max-w-md space-y-3">
            {pitch.points.map((point, i) => (
              <li
                key={point.text}
                className="auth-rise flex items-center gap-3.5 rounded-2xl border border-white/40 bg-background/40 px-4 py-3.5 text-[15px] text-foreground/85 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-background/30"
                style={{ '--rise-delay': `${160 + i * 70}ms` } as CSSProperties}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary ring-1 ring-primary/20">
                  <point.icon className="h-4.5 w-4.5" />
                </span>
                {point.text}
              </li>
            ))}
          </ul>
        </aside>

        <main
          className="auth-rise w-full max-w-md justify-self-center lg:max-w-none"
          style={{ '--rise-delay': '120ms' } as CSSProperties}
        >
          <div className="auth-card relative rounded-3xl border border-white/50 bg-background/80 p-6 shadow-[0_24px_80px_-24px_rgb(30_27_75/0.35)] sm:p-9 dark:border-white/10 dark:bg-background/70 dark:shadow-[0_24px_80px_-24px_rgb(0_0_0/0.8)]">
            {/* Thin highlight along the top edge, like light catching the glass. */}
            <div aria-hidden className="absolute inset-x-10 -top-px h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
            <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        </main>
      </div>

      <footer className="mx-auto w-full max-w-6xl px-6 pb-6 text-center text-xs text-muted-foreground lg:pb-8 lg:text-left">© RealCheck</footer>
    </div>
  );
}
