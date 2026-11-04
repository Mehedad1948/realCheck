'use client';

import { Loader2, Rocket } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { setDatasetStatusAction } from '@/server/actions/datasets';

export function GoLiveButton({ datasetId, disabled }: { datasetId: string; disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();
  return (
    <Button
      disabled={disabled || isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await setDatasetStatusAction({ datasetId, status: 'ACTIVE' });
          if (result.ok) toast.success('Your dataset is live for evaluators');
          else toast.error(result.error);
        })
      }
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Rocket />}
      Go live
    </Button>
  );
}
