import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * A dark panel with the landing page's indigo silk behind its content. It stays dark in both themes,
 * like a premium card. The silk is a still frame captured from the landing shader (silk + glow, already
 * composited): the mini app only runs on phones, where the live shader stutters and drifts in color.
 */
export function SilkCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative isolate overflow-hidden rounded-[28px] bg-[#0b0a14] text-white', className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('/images/silk-card.webp')] bg-cover bg-center" />
        {/* Keeps the figures readable where a bright fold passes behind them. */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-black/10 to-black/55" />
      </div>
      {/* The same hairline edge as the landing frame. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12),inset_0_1px_0_rgb(255_255_255/0.08)]" />
      {children}
    </div>
  );
}
