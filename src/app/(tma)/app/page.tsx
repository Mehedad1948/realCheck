import { connection } from 'next/server';
import { Suspense } from 'react';
import { HomeHeader, HomeSummary } from '@/features/tma/home-summary';
import { OpenDatasetList } from '@/features/tma/open-dataset-list';
import { Screen, Section, SkeletonRows } from '@/features/tma/ui';
import { getOpenDatasets } from '@/server/queries/public';

// Static shell + cached public dataset list from the server + the evaluator's
// private data fetched on the client through the BFF. The list is read at
// request time (still served from the shared cache) so builds never need the database.
export default function MiniAppHome() {
  return (
    <Screen>
      <HomeHeader />
      <HomeSummary />
      <div className="mt-6">
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
    </Screen>
  );
}

async function OpenDatasets() {
  await connection();
  return <OpenDatasetList initialData={await getOpenDatasets()} />;
}
