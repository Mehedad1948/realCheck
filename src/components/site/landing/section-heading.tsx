import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Eyebrow plus a two-tone display headline: the first line in full color, the second receding. */
export function SectionHeading({
  index,
  eyebrow,
  title,
  muted,
  className,
  children,
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  muted?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn('max-w-2xl', className)}>
      <p className="flex items-center gap-3 text-sm font-medium text-foreground/70">
        {index && <span className="font-mono text-xs">{index}</span>}
        {index && <span aria-hidden className="h-px w-8 bg-foreground/25" />}
        {eyebrow}
      </p>
      <h2 className="mt-6 font-display text-[clamp(2.25rem,5vw,3.75rem)] leading-[1.04] font-light tracking-[-0.035em]">
        <span className="block">{title}</span>
        {muted && <span className="block text-foreground/60">{muted}</span>}
      </h2>
      {children && <p className="mt-6 max-w-xl text-lg leading-relaxed text-foreground/80 md:text-xl">{children}</p>}
    </div>
  );
}
