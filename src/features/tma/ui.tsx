import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

// Telegram-native building blocks: grouped sections with inset rows, as in
// Telegram's own settings screens. Colors come from the user's Telegram theme.

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
        <div className="mb-1.5 flex items-end justify-between px-4">
          {title && <h2 className="text-[13px] font-medium tracking-wide text-section-label uppercase">{title}</h2>}
          {action}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl bg-card text-card-foreground">{children}</div>
      {footer && <p className="mt-1.5 px-4 text-[13px] leading-snug text-muted-foreground">{footer}</p>}
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
        {chevron && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" />}
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

/** Rounded-square icon tile used at the start of rows. */
export function IconTile({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] text-white [&_svg]:h-[18px] [&_svg]:w-[18px]', className)}>
      {children}
    </div>
  );
}

export function UserAvatar({ name, photoUrl, size = 44 }: { name: string; photoUrl?: string | null; size?: number }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials || '?'}
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt="" className="absolute inset-0 h-full w-full object-cover" referrerPolicy="no-referrer" />
      )}
    </div>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex h-16 items-center gap-3 border-b border-border px-4 last:border-0">
          <div className="h-9 w-9 animate-pulse rounded-[10px] bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
            <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
