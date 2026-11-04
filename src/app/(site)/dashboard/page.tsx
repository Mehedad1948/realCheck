import { CheckCircle2, Database, Upload, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { requireClientPage } from '@/server/auth/dal';
import { getOwnerDatasets } from '@/server/queries/owner';
import { DatasetGrid, NewDatasetLink } from './_components/dataset-grid';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const viewer = await requireClientPage();
  const datasets = await getOwnerDatasets(viewer.id);

  const totalTasks = datasets.reduce((sum, d) => sum + d.totalTasks, 0);
  const completedTasks = datasets.reduce((sum, d) => sum + d.completedTasks, 0);

  const stats = [
    { label: 'Datasets', value: datasets.length.toLocaleString('en-US'), icon: Database, tone: 'bg-primary/10 text-primary' },
    { label: 'Tasks uploaded', value: totalTasks.toLocaleString('en-US'), icon: Upload, tone: 'bg-green-500/10 text-green-600' },
    { label: 'Tasks labeled', value: completedTasks.toLocaleString('en-US'), icon: CheckCircle2, tone: 'bg-blue-500/10 text-blue-600' },
    { label: 'Balance', value: formatMoney(viewer.balanceCents), icon: Wallet, tone: 'bg-amber-500/10 text-amber-600' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-muted-foreground">Manage your datasets and track labeling progress.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/guide"
            className="inline-flex items-center rounded-lg border border-input px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent"
          >
            Guide
          </Link>
          <NewDatasetLink />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.tone}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold tabular-nums">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Your datasets</h2>
        <DatasetGrid datasets={datasets} />
      </section>
    </div>
  );
}
