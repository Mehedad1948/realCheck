import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/site/page-header';
import { requireClientPage } from '@/server/auth/dal';
import { getOwnerDatasets } from '@/server/queries/owner';
import { DatasetGrid, NewDatasetLink } from '../_components/dataset-grid';
import { GridSkeleton } from '../_components/skeletons';

export const metadata: Metadata = { title: 'Datasets' };

export default function DatasetsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Datasets" description="Every dataset you own, newest first." actions={<NewDatasetLink />} />
      <Suspense fallback={<GridSkeleton />}>
        <Datasets />
      </Suspense>
    </div>
  );
}

async function Datasets() {
  const viewer = await requireClientPage();
  return <DatasetGrid datasets={await getOwnerDatasets(viewer.id)} />;
}
