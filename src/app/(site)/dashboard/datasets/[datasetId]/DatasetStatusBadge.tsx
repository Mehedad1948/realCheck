'use client';

import { Loader2 } from 'lucide-react';
import { useOptimistic, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { setDatasetStatusAction } from '@/server/actions/datasets';

type Status = 'ACTIVE' | 'PAUSED' | 'COMPLETED';

const styles: Record<Status, string> = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  PAUSED: 'bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200 cursor-default dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
};
const dots: Record<Status, string> = { ACTIVE: 'bg-green-500', PAUSED: 'bg-yellow-500', COMPLETED: 'bg-blue-500' };

export function DatasetStatusBadge({ datasetId, initialStatus }: { datasetId: string; initialStatus: Status }) {
  // Optimistic while the action runs; reverts automatically if it fails.
  const [status, setOptimisticStatus] = useOptimistic(initialStatus);
  const [isPending, startTransition] = useTransition();
  const isEditable = status !== 'COMPLETED';

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
        'flex items-center rounded-full border px-3 py-1 text-xs font-bold transition-colors select-none',
        styles[status],
        isPending && 'cursor-wait opacity-70',
      )}
      title={isEditable ? (status === 'ACTIVE' ? 'Click to pause' : 'Click to activate') : 'Completed'}
    >
      {isPending ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <span className={cn('mr-2 h-2 w-2 rounded-full', dots[status])} />}
      {status}
    </button>
  );
}
