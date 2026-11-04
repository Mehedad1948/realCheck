import { cn } from '@/lib/utils';

const styles = {
  ACTIVE: 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400',
  PAUSED: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400',
  COMPLETED: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400',
} as const;

export function StatusPill({ status }: { status: keyof typeof styles }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium', styles[status])}>
      {status}
    </span>
  );
}
