import type { Metadata } from 'next';
import { requireClientPage } from '@/server/auth/dal';
import { getOwnerDatasets } from '@/server/queries/owner';
import { DatasetGrid } from '../_components/dataset-grid';

export const metadata: Metadata = { title: 'My datasets' };

export default async function DatasetsPage() {
  const viewer = await requireClientPage();
  const datasets = await getOwnerDatasets(viewer.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My datasets</h1>
        <p className="mt-1 text-muted-foreground">Every dataset you own, newest first.</p>
      </div>
      <DatasetGrid datasets={datasets} />
    </div>
  );
}
