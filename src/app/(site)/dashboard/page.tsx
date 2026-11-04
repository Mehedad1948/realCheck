import { CheckCircle2, Database, Upload, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { PageHeader } from '@/components/site/page-header';
import { StatCard } from '@/components/site/stat-card';
import { formatMoney } from '@/lib/money';
import { requireClientPage } from '@/server/auth/dal';
import { getOwnerDatasets } from '@/server/queries/owner';
import { DatasetGrid, NewDatasetLink } from './_components/dataset-grid';
import { GettingStarted, type Step } from './_components/getting-started';
import { ContentSkeleton } from './_components/skeletons';

export const metadata: Metadata = { title: 'Overview' };

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Overview" description="Your datasets and labeling progress at a glance." actions={<NewDatasetLink />} />
      <Suspense fallback={<ContentSkeleton />}>
        <Overview />
      </Suspense>
    </div>
  );
}

async function Overview() {
  const viewer = await requireClientPage();
  const datasets = await getOwnerDatasets(viewer.id);

  const totalTasks = datasets.reduce((sum, d) => sum + d.totalTasks, 0);
  const completedTasks = datasets.reduce((sum, d) => sum + d.completedTasks, 0);
  const live = datasets.filter((d) => d.status === 'ACTIVE').length;
  const oldest = datasets.at(-1);
  const datasetHref = (suffix = '') => (oldest ? `/dashboard/datasets/${oldest.id}${suffix}` : '/dashboard/datasets/create');

  const steps: Step[] = [
    {
      title: 'Create a dataset',
      description: 'Choose the question evaluators will answer.',
      done: datasets.length > 0,
      href: '/dashboard/datasets/create',
      cta: 'Create',
    },
    {
      title: 'Upload your data',
      description: 'Import a CSV or JSON file of texts or image URLs.',
      done: totalTasks > 0,
      href: datasetHref('/upload'),
      cta: 'Upload',
    },
    {
      title: 'Fund your balance',
      description: 'You pay per answer received.',
      done: viewer.balanceCents > 0,
      href: '/dashboard/billing',
      cta: 'Add funds',
    },
    {
      title: 'Go live',
      description: 'Activate a dataset to send it to evaluators.',
      done: datasets.some((d) => d.status !== 'PAUSED'),
      href: datasetHref(),
      cta: 'Activate',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Datasets" value={datasets.length.toLocaleString('en-US')} hint={`${live} live`} icon={Database} />
        <StatCard label="Items uploaded" value={totalTasks.toLocaleString('en-US')} icon={Upload} />
        <StatCard
          label="Items labeled"
          value={completedTasks.toLocaleString('en-US')}
          hint={totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% of all items` : undefined}
          icon={CheckCircle2}
        />
        <StatCard
          label="Balance"
          value={formatMoney(viewer.balanceCents)}
          hint={
            <Link href="/dashboard/billing" className="hover:text-foreground">
              View billing →
            </Link>
          }
          icon={Wallet}
        />
      </div>

      <GettingStarted steps={steps} />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent datasets</h2>
          {datasets.length > 6 && (
            <Link href="/dashboard/datasets" className="text-sm text-muted-foreground hover:text-foreground">
              View all →
            </Link>
          )}
        </div>
        <DatasetGrid datasets={datasets.slice(0, 6)} />
      </section>
    </div>
  );
}
