import { Database, Plus } from 'lucide-react';
import Link from 'next/link';
import type { OwnerDatasetSummary } from '@/server/queries/owner';
import { StatusPill } from './status-pill';

export function DatasetGrid({ datasets }: { datasets: OwnerDatasetSummary[] }) {
  if (datasets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 py-12 text-center">
        <div className="mb-3 rounded-full bg-muted p-4">
          <Database className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">No datasets yet</h3>
        <p className="mt-1 mb-4 max-w-sm text-muted-foreground">Create a dataset to start collecting labels.</p>
        <NewDatasetLink />
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <Link
        href="/dashboard/datasets/create"
        className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-primary/50 hover:bg-primary/5"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
          <Plus className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold">New dataset</h3>
        <p className="mt-1 text-center text-sm text-muted-foreground">Define a question, then upload CSV or JSON.</p>
      </Link>

      {datasets.map((dataset) => {
        const progress = dataset.totalTasks > 0 ? Math.round((dataset.completedTasks / dataset.totalTasks) * 100) : 0;
        return (
          <div key={dataset.id} className="flex flex-col rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            <Link href={`/dashboard/datasets/${dataset.id}`} className="block p-5">
              <div className="mb-2 flex items-center gap-2">
                <StatusPill status={dataset.status} />
                <span className="rounded border border-border px-1.5 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                  {dataset.dataType}
                </span>
              </div>
              <h3 className="line-clamp-1 font-semibold" title={dataset.question}>
                {dataset.title}
              </h3>
            </Link>

            <div className="flex-1 px-5">
              <div className="mb-2 flex justify-between text-sm text-muted-foreground">
                <span>Completion</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                {dataset.completedTasks.toLocaleString('en-US')} of {dataset.totalTasks.toLocaleString('en-US')} tasks labeled
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-b-xl border-t border-border bg-muted/30 p-4">
              <span className="text-xs text-muted-foreground">
                Created {dataset.createdAt.toLocaleDateString('en-US', { dateStyle: 'medium' })}
              </span>
              <Link
                href={`/dashboard/datasets/${dataset.id}/upload`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Add data &rarr;
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function NewDatasetLink() {
  return (
    <Link
      href="/dashboard/datasets/create"
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:brightness-110"
    >
      <Plus className="h-4 w-4" />
      New Dataset
    </Link>
  );
}
