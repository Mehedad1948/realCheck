import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TaskRunner } from '@/features/tma/task-runner';
import { getPublicDataset } from '@/server/queries/public';

type Props = { params: Promise<{ datasetId: string }> };

// Same as the Mini App's task screen: the dataset is public and cached, the batch is private and
// fetched by the TaskRunner.
export default function EarnTasksPage({ params }: Props) {
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
    <div className="mx-auto max-w-lg space-y-4 pt-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-[60vh] w-full rounded-2xl" />
    </div>
  );
}
