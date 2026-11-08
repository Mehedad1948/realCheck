import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';
import { PageHeader } from '@/components/site/page-header';
import { HomeSummary } from '@/features/tma/home-summary';
import { OpenDatasetList } from '@/features/tma/open-dataset-list';
import { Section, SkeletonRows } from '@/features/tma/ui';
import { getOpenDatasets } from '@/server/queries/public';

export const metadata: Metadata = { title: 'Tasks' };

// The Mini App's home, laid out for a wide screen: standing on the left, the work on the right.
export default function EarnHomePage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Tasks" description="Pick a dataset and start answering. Every accepted answer adds to your balance." />
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="lg:sticky lg:top-8">
          <HomeSummary />
        </div>
        <Suspense
          fallback={
            <Section title="Available tasks">
              <SkeletonRows />
            </Section>
          }
        >
          <OpenDatasets />
        </Suspense>
      </div>
    </div>
  );
}

async function OpenDatasets() {
  await connection();
  return <OpenDatasetList initialData={await getOpenDatasets()} />;
}
