import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskRunner } from '@/features/tma/task-runner';
import { getPublicDataset } from '@/server/queries/public';

type Props = { params: Promise<{ datasetId: string }> };

// The dataset's question and options are public and cached; the evaluator's batch
// of tasks is private and fetched by the TaskRunner through the BFF.
export default function DatasetTasksPage({ params }: Props) {
  return (
    <Suspense fallback={<TaskPageSkeleton />}>
      <DatasetTasks params={params} />
    </Suspense>
  );
}

async function DatasetTasks({ params }: Props) {
  const { datasetId } = await params;
  const dataset = await getPublicDataset(datasetId);
  if (!dataset) notFound();
  return <TaskRunner dataset={dataset} />;
}

function TaskPageSkeleton() {
  return (
    <div className="mx-auto max-w-md space-y-4 p-4">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-[60vh] w-full rounded-xl" />
    </div>
  );
}
