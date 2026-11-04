import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: 'danger';
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', tone === 'danger' && 'border-destructive/40 bg-destructive/[0.04]')}>
      <div className="flex items-center justify-between">
        <p className={cn('text-[13px] font-medium text-muted-foreground', tone === 'danger' && 'text-destructive')}>{label}</p>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/70" />}
      </div>
      <div className={cn('mt-2 text-2xl font-semibold tracking-tight tabular-nums', tone === 'danger' && 'text-destructive')}>{value}</div>
      {hint && <p className="mt-1 text-[13px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
