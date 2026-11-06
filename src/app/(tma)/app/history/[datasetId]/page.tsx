import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DatasetHistoryView } from '@/features/tma/history';
import { Screen, SkeletonRows } from '@/features/tma/ui';

export const metadata: Metadata = { title: 'History' };

type Props = { params: Promise<{ datasetId: string }> };

// Everything here is private to the evaluator, so it is fetched on the client through the BFF.
export default function DatasetHistoryPage({ params }: Props) {
  return (
    <Screen>
      <Suspense fallback={<SkeletonRows count={5} />}>
        <DatasetHistory params={params} />
      </Suspense>
    </Screen>
  );
}

async function DatasetHistory({ params }: Props) {
  const { datasetId } = await params;
  return <DatasetHistoryView datasetId={datasetId} />;
}
