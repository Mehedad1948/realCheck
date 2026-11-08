import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Suspense } from 'react';
import { DatasetHistoryView } from '@/features/tma/history';
import { SkeletonRows } from '@/features/tma/ui';

export const metadata: Metadata = { title: 'History' };

type Props = { params: Promise<{ datasetId: string }> };

export default function EarnDatasetHistoryPage({ params }: Props) {
  return (
    <div className="mx-auto max-w-2xl">
      {/* Telegram's native back button does this in the Mini App. */}
      <Link href="/earn/history" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> History
      </Link>
      <Suspense fallback={<SkeletonRows count={5} />}>
        <DatasetHistory params={params} />
      </Suspense>
    </div>
  );
}

async function DatasetHistory({ params }: Props) {
  const { datasetId } = await params;
  return <DatasetHistoryView datasetId={datasetId} />;
}
