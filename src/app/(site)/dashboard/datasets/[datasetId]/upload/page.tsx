import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireClientPage } from '@/server/auth/dal';
import { getOwnerDataset } from '@/server/queries/owner';
import { UploadForm } from './upload-form';

export const metadata: Metadata = { title: 'Upload data' };

export default async function UploadPage({ params }: { params: Promise<{ datasetId: string }> }) {
  const viewer = await requireClientPage();
  const { datasetId } = await params;
  const dataset = await getOwnerDataset(viewer.id, datasetId);
  if (!dataset) notFound();

  return (
    <UploadForm
      dataset={{ id: dataset.id, title: dataset.title, dataType: dataset.dataType, options: dataset.options }}
    />
  );
}
