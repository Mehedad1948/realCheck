import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { requireClientPage } from '@/server/auth/dal';
import { getOwnerDataset } from '@/server/queries/owner';
import { ContentSkeleton } from '../../../_components/skeletons';
import { UploadForm } from './upload-form';

export const metadata: Metadata = { title: 'Upload data' };

type Props = { params: Promise<{ datasetId: string }> };

export default function UploadPage({ params }: Props) {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <Upload params={params} />
    </Suspense>
  );
}

async function Upload({ params }: Props) {
  const viewer = await requireClientPage();
  const { datasetId } = await params;
  const dataset = await getOwnerDataset(viewer.id, datasetId);
  if (!dataset) notFound();

  return <UploadForm dataset={{ id: dataset.id, title: dataset.title, dataType: dataset.dataType, options: dataset.options }} />;
}
