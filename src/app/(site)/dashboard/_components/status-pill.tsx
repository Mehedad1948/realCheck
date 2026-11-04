import { cn } from '@/lib/utils';

const styles = {
  ACTIVE: { label: 'Live', className: 'text-success', dot: 'bg-success' },
  PAUSED: { label: 'Paused', className: 'text-warning', dot: 'bg-warning' },
  COMPLETED: { label: 'Completed', className: 'text-primary', dot: 'bg-primary' },
} as const;

export function StatusPill({ status }: { status: keyof typeof styles }) {
  const style = styles[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-[12px] font-medium',
        style.className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot, status === 'ACTIVE' && 'animate-pulse')} />
      {style.label}
    </span>
  );
}
