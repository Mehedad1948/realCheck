import { ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { formatMoney } from '@/lib/money';
import { botUrl, datasetStartParam } from '@/lib/telegram';
import { cn } from '@/lib/utils';
import { requireClientPage } from '@/server/auth/dal';
import { getOwnerDataset } from '@/server/queries/owner';
import { ClearTasksButton } from './ClearTasksButton';
import { DatasetStatusBadge } from './DatasetStatusBadge';
import { EditableField } from './EditableField';
import { ExportResultsButton } from './ExportResultsButton';

export const metadata: Metadata = { title: 'Dataset' };

export default async function DatasetDetailsPage({ params }: { params: Promise<{ datasetId: string }> }) {
  const viewer = await requireClientPage();
  const { datasetId } = await params;
  // Scoped to the signed-in owner: other clients' datasets are simply not found.
  const dataset = await getOwnerDataset(viewer.id, datasetId);
  if (!dataset) notFound();

  const { stats } = dataset;
  const progress = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const isUnderfunded = stats.remainingTasks > 0 && viewer.balanceCents < stats.estimatedCostCents;
  const shareUrl = botUrl(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME, datasetStartParam(dataset.id));

  return (
    <div className="space-y-8">
      <Link href="/dashboard/datasets" className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" />
        All datasets
      </Link>

      <header className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-center">
        <div className="w-full max-w-2xl space-y-2">
          <EditableField datasetId={dataset.id} field="title" initialValue={dataset.title} className="text-3xl font-bold" />
          <div className="text-muted-foreground">
            <EditableField
              datasetId={dataset.id}
              field="description"
              initialValue={dataset.description ?? ''}
              placeholder="Add instructions for evaluators"
              isMultiline
            />
          </div>
          <p className="text-sm">
            <span className="text-muted-foreground">Question:</span> {dataset.question}{' '}
            <span className="text-muted-foreground">({dataset.options.join(' / ')})</span>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <ExportResultsButton datasetId={dataset.id} disabled={stats.votes === 0} />
          <Link
            href={`/dashboard/datasets/${dataset.id}/upload`}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Add data
          </Link>
          <DatasetStatusBadge key={dataset.status} datasetId={dataset.id} initialStatus={dataset.status} />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard label="Tasks" value={stats.totalTasks.toLocaleString('en-US')} hint={`${stats.goldTasks} check questions`} />
        <StatCard
          label={isUnderfunded ? 'Balance too low to finish' : 'Max cost to finish'}
          value={formatMoney(stats.estimatedCostCents)}
          hint={`${formatMoney(dataset.rewardCents)} per answer · balance ${formatMoney(viewer.balanceCents)}`}
          tone={isUnderfunded ? 'danger' : undefined}
        />
        <StatCard
          label="Answers per task"
          value={
            <EditableField
              datasetId={dataset.id}
              field="requiredVotes"
              initialValue={dataset.requiredVotes}
              type="number"
              className="max-w-16 font-bold"
            />
          }
          hint="Locked once labeling starts"
        />
        <StatCard label="Answers collected" value={stats.votes.toLocaleString('en-US')} hint={`Since ${dataset.createdAt.toLocaleDateString('en-US', { dateStyle: 'medium' })}`} />
      </div>

      {shareUrl && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm">
          <span className="text-muted-foreground">Invite evaluators straight to this dataset: </span>
          <code className="rounded bg-muted px-1.5 py-0.5 break-all">{shareUrl}</code>
        </div>
      )}

      {stats.totalTasks === 0 && stats.goldTasks === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
          <h3 className="mb-2 text-xl font-semibold">This dataset is empty</h3>
          <p className="mb-6 max-w-md text-muted-foreground">
            Upload a CSV or JSON file with the items you want labeled, then activate the dataset.
          </p>
          <Link
            href={`/dashboard/datasets/${dataset.id}/upload`}
            className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-md hover:brightness-110"
          >
            Upload data →
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-2 flex items-end justify-between">
              <div>
                <h3 className="text-lg font-semibold">Labeling progress</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.completedTasks.toLocaleString('en-US')} of {stats.totalTasks.toLocaleString('en-US')} tasks reached consensus
                </p>
              </div>
              <span className="text-2xl font-bold text-primary">{progress}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/30 p-4">
              <h3 className="font-semibold">First 5 tasks</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="px-6 py-3">Content</th>
                    <th className="px-6 py-3 text-center">Answers</th>
                    <th className="px-6 py-3 text-center">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {dataset.tasks.map((task) => (
                    <tr key={task.id} className="border-b border-border last:border-0">
                      <td className="max-w-md truncate px-6 py-4 font-medium" title={task.content}>
                        {task.isValidation && (
                          <span className="mr-2 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600 uppercase">check</span>
                        )}
                        {dataset.dataType === 'IMAGE' ? (
                          <a href={task.imageUrls[0] ?? task.content} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {task.content}
                          </a>
                        ) : (
                          task.content
                        )}
                      </td>
                      <td className="px-6 py-4 text-center tabular-nums">
                        {task.collectedVotes}
                        {!task.isValidation && ` / ${dataset.requiredVotes}`}
                      </td>
                      <td className="px-6 py-4 text-center text-xs">
                        {task.status === 'COMPLETED' ? (
                          task.consensusLabel ? (
                            <span className="font-semibold text-green-600">
                              {task.consensusLabel} ({Math.round((task.agreement ?? 0) * 100)}%)
                            </span>
                          ) : (
                            <span className="font-semibold text-amber-600">No consensus</span>
                          )
                        ) : (
                          <span className="text-muted-foreground">In progress</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ClearTasksButton datasetId={dataset.id} canClear={dataset.status !== 'ACTIVE'} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: 'danger' }) {
  return (
    <div className={cn('rounded-lg border border-border bg-card p-4 shadow-sm', tone === 'danger' && 'border-destructive/50 bg-destructive/5')}>
      <p className={cn('text-xs font-semibold tracking-wide text-muted-foreground uppercase', tone === 'danger' && 'text-destructive')}>
        {label}
      </p>
      <div className={cn('text-lg font-bold', tone === 'danger' && 'text-destructive')}>{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
