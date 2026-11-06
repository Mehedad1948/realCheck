'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// The landing page's silk, in its own client-only chunk so the shader never blocks the first paint.
const Silk = dynamic(() => import('@/components/site/silk'), { ssr: false });

/**
 * A dark panel with the landing page's indigo silk flowing behind its content. It stays dark in both
 * themes, like a premium card. The glow underneath shows while WebGL loads or where it's unavailable.
 */
export function SilkCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative isolate overflow-hidden rounded-[28px] bg-[#0b0a14] text-white', className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-indigo-600/40 blur-[70px]" />
        <div className="absolute inset-0 opacity-80">
          <Silk
            color="#4f46e5"
            sheenColor="#c4b5fd"
            speed={2}
            scale={0.9}
            rotation={-0.5}
            depth={0.6}
            sheen={0.45}
            glow={0}
            noiseIntensity={0.6}
            mouseInteraction={false}
            clickRipple={false}
            dpr={0.75}
            maxFps={30}
          />
        </div>
        {/* Keeps the figures readable where a bright fold passes behind them. */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/45 via-black/10 to-black/55" />
      </div>
      {/* The same hairline edge as the landing frame. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[inherit] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12),inset_0_1px_0_rgb(255_255_255/0.08)]" />
      {children}
    </div>
  );
}
