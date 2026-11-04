'use client';

import { Loader2 } from 'lucide-react';
import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { setDatasetStatusAction } from '@/server/actions/datasets';

type Status = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

const styles: Record<Status, { label: string; text: string; dot: string }> = {
  ACTIVE: { label: 'Live', text: 'text-success', dot: 'bg-success' },
  PAUSED: { label: 'Paused', text: 'text-warning', dot: 'bg-warning' },
  COMPLETED: { label: 'Completed', text: 'text-primary', dot: 'bg-primary' },
};

/** Status chip that doubles as a pause / resume toggle. */
export function DatasetStatusBadge({ datasetId, initialStatus }: { datasetId: string; initialStatus: Status }) {
  // Optimistic while the action runs; reverts automatically if it fails.
  const [status, setOptimisticStatus] = useOptimistic(initialStatus);
  const [isPending, startTransition] = useTransition();
  const isEditable = status !== 'COMPLETED';
  const style = styles[status];

  const toggle = () => {
    if (!isEditable || isPending) return;
    const next = status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    startTransition(async () => {
      setOptimisticStatus(next);
      const result = await setDatasetStatusAction({ datasetId, status: next });
      if (result.ok) toast.success(next === 'ACTIVE' ? 'Dataset is live for evaluators' : 'Dataset paused');
      else toast.error(result.error);
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={!isEditable || isPending}
      className={cn(
        'group inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors select-none',
        isEditable && 'hover:bg-accent',
        style.text,
      )}
      title={isEditable ? (status === 'ACTIVE' ? 'Pause this dataset' : 'Make this dataset live') : 'Completed'}
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <span className={cn('h-2 w-2 rounded-full', style.dot)} />}
      {style.label}
      {isEditable && (
        <span className="text-[12px] font-normal text-muted-foreground">· {status === 'ACTIVE' ? 'Pause' : 'Resume'}</span>
      )}
    </button>
  );
}
