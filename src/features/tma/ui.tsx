import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Building blocks in the landing page's language: hairline-bordered surfaces on a near-black canvas,
// quiet labels, and Roboto Flex at light weights for anything that should read as a headline.

export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto w-full max-w-lg px-4 pt-3 pb-[calc(var(--tab-bar-height)+24px)]', className)}>
      {children}
    </div>
  );
}

export function Section({
  title,
  action,
  footer,
  children,
  className,
}: {
  title?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('mt-6 first:mt-0', className)}>
      {(title || action) && (
        <div className="mb-2.5 flex items-end justify-between px-1">
          {title && <h2 className="text-[13px] text-section-label">{title}</h2>}
          {action}
        </div>
      )}
      <Surface>{children}</Surface>
      {footer && <p className="mt-2.5 px-1 text-[12px] leading-snug text-muted-foreground/80">{footer}</p>}
    </section>
  );
}

type RowProps = {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  chevron?: boolean;
  className?: string;
};

/** A list row. Rows inside one Section are separated by an inset hairline. */
export function Row({ icon, title, subtitle, trailing, href, chevron = Boolean(href), className }: RowProps) {
  const content = (
    <div className={cn('flex min-h-14 items-center gap-3 pl-4', className)}>
      {icon && <div className="shrink-0">{icon}</div>}
      <div className="flex min-w-0 flex-1 items-center gap-3 border-b border-border py-2.5 pr-4 group-last/row:border-b-0">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] leading-tight font-medium">{title}</div>
          {subtitle && <div className="mt-0.5 truncate text-[13px] text-muted-foreground">{subtitle}</div>}
        </div>
        {trailing && <div className="shrink-0 text-[15px] text-muted-foreground">{trailing}</div>}
        {chevron && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" strokeWidth={1.5} />}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group/row block transition-colors active:bg-accent">
        {content}
      </Link>
    );
  }
  return <div className="group/row">{content}</div>;
}

/** A card with a hairline edge, like the landing page's silk frame. */
export function Surface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-[22px] bg-card text-card-foreground ring-1 ring-border ring-inset', className)}>
      {children}
    </div>
  );
}

/** Large figures and headlines, set like the landing headline: Roboto Flex, light and tight. */
export function Display({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-display font-[260] tracking-[-0.03em] tabular-nums', className)}>{children}</span>;
}

/** An amount with the cents dimmed, the way the landing headline dims its second line. */
export function Money({ value, className }: { value: string; className?: string }) {
  const [whole, cents] = value.split('.');
  return (
    <Display className={className}>
      {whole}
      {cents !== undefined && <span className="opacity-45">.{cents}</span>}
    </Display>
  );
}

/** Rounded-square icon tile used at the start of rows: a quiet indigo tint with a fine-stroked icon. */
export function IconTile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-primary/10 text-accent-text ring-1 ring-primary/15 ring-inset [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:stroke-[1.6]',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <Surface>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex h-16 items-center gap-3 border-b border-border px-4 last:border-0">
          <div className="h-9 w-9 animate-pulse rounded-[11px] bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </Surface>
  );
}
