import { Database, FileText, Image as ImageIcon, Plus } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/site/empty-state';
import type { OwnerDatasetSummary } from '@/server/queries/owner';
import { StatusPill } from './status-pill';

export function DatasetGrid({ datasets }: { datasets: OwnerDatasetSummary[] }) {
  if (datasets.length === 0) {
    return (
      <EmptyState
        icon={Database}
        title="No datasets yet"
        description="A dataset is one question asked about many items. Create one to start collecting labels."
        action={<NewDatasetLink />}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {datasets.map((dataset) => {
        const progress = dataset.totalTasks > 0 ? Math.round((dataset.completedTasks / dataset.totalTasks) * 100) : 0;
        const TypeIcon = dataset.dataType === 'IMAGE' ? ImageIcon : FileText;
        return (
          <Link
            key={dataset.id}
            href={`/dashboard/datasets/${dataset.id}`}
            className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <TypeIcon className="h-4 w-4" />
              </div>
              <StatusPill status={dataset.status} />
            </div>
            <h3 className="mt-4 line-clamp-1 font-semibold">{dataset.title}</h3>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground" title={dataset.question}>
              {dataset.question}
            </p>

            <div className="mt-6">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground tabular-nums">
                  {dataset.completedTasks.toLocaleString('en-US')} / {dataset.totalTasks.toLocaleString('en-US')} labeled
                </span>
                <span className="font-medium tabular-nums">{progress}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <p className="mt-4 text-[12px] text-muted-foreground">
              Created {dataset.createdAt.toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </p>
          </Link>
        );
      })}

      <Link
        href="/dashboard/datasets/create"
        className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
      >
        <Plus className="h-5 w-5" />
        <span className="mt-2 text-sm font-medium">New dataset</span>
      </Link>
    </div>
  );
}

export function NewDatasetLink() {
  return (
    <Link
      href="/dashboard/datasets/create"
      className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:brightness-110"
    >
      <Plus className="h-4 w-4" />
      New dataset
    </Link>
  );
}
