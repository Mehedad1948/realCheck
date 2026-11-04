import { Zap } from 'lucide-react';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { EvaluatorCard } from '@/features/tma/evaluator-card';
import { OpenDatasetList } from '@/features/tma/open-dataset-list';
import { getOpenDatasets } from '@/server/queries/public';

// Static shell (header, layout) + cached public dataset list from the server +
// the evaluator's private data fetched on the client through the BFF.
export default function MiniAppHome() {
  return (
    <div className="mx-auto max-w-xl space-y-6 p-4 pb-20">
      <header>
        <h1 className="text-2xl font-bold">RealCheck</h1>
        <p className="text-sm text-muted-foreground">Label data. Get paid for every accepted answer.</p>
      </header>

      <EvaluatorCard />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Zap className="h-5 w-5 fill-yellow-500 text-yellow-500" />
          Available tasks
        </h2>
        <Suspense fallback={<DatasetListSkeleton />}>
          <OpenDatasets />
        </Suspense>
      </section>
    </div>
  );
}

async function OpenDatasets() {
  return <OpenDatasetList initialData={await getOpenDatasets()} />;
}

function DatasetListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-20 w-full rounded-xl" />
      ))}
    </div>
  );
}
