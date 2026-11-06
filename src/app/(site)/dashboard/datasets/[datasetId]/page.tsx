import { Check, ChevronLeft, CircleDollarSign, Coins, Layers, MessagesSquare, Send, ShieldCheck, Upload } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CopyButton } from '@/components/site/copy-button';
import { StatCard } from '@/components/site/stat-card';
import { ACTIVATION_FUNDING_TASKS } from '@/lib/constants';
import { chargePerAnswerCents, formatMoney, platformFeeCents } from '@/lib/money';
import { botUrl, datasetStartParam } from '@/lib/telegram';
import { cn } from '@/lib/utils';
import { requireClientPage } from '@/server/auth/dal';
import { getOwnerDataset, type OwnerDataset } from '@/server/queries/owner';
import { ContentSkeleton } from '../../_components/skeletons';
import { ClearTasksButton } from './ClearTasksButton';
import { DatasetStatusBadge } from './DatasetStatusBadge';
import { EditableField } from './EditableField';
import { ExportResultsButton } from './ExportResultsButton';
import { GoLiveButton } from './GoLiveButton';

export const metadata: Metadata = { title: 'Dataset' };

type Props = { params: Promise<{ datasetId: string }> };

export default function DatasetDetailsPage({ params }: Props) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DatasetDetails params={params} />
    </Suspense>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-border pb-6">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-8 w-72 animate-pulse rounded-lg bg-muted" />
      </div>
      <ContentSkeleton />
    </div>
  );
}

async function DatasetDetails({ params }: Props) {
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
      <div>
        <Link href="/dashboard/datasets" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" />
          Datasets
        </Link>

        <header className="mt-3 flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <EditableField datasetId={dataset.id} field="title" initialValue={dataset.title} className="text-[28px] font-semibold tracking-tight" />
            <p className="mt-1 text-sm text-muted-foreground">
              {dataset.dataType === 'IMAGE' ? 'Image' : 'Text'} dataset · created{' '}
              {dataset.createdAt.toLocaleDateString('en-US', { dateStyle: 'medium' })}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <DatasetStatusBadge key={dataset.status} datasetId={dataset.id} initialStatus={dataset.status} />
            <ExportResultsButton datasetId={dataset.id} disabled={stats.votes === 0} />
            <Link
              href={`/dashboard/datasets/${dataset.id}/upload`}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
            >
              <Upload className="h-4 w-4" /> Add data
            </Link>
          </div>
        </header>
      </div>

      {dataset.status === 'PAUSED' && <LaunchChecklist dataset={dataset} balanceCents={viewer.balanceCents} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Items" value={stats.totalTasks.toLocaleString('en-US')} hint={`+ ${stats.goldTasks} check question${stats.goldTasks === 1 ? "" : "s"}`} icon={Layers} />
        <StatCard
          label="Labeled"
          value={`${progress}%`}
          hint={`${stats.resolvedTasks.toLocaleString('en-US')} reached consensus${stats.disputedTasks > 0 ? ` · ${stats.disputedTasks.toLocaleString('en-US')} disputed` : ''}`}
          icon={Check}
        />
        <StatCard label="Answers collected" value={stats.votes.toLocaleString('en-US')} icon={MessagesSquare} />
        <StatCard
          label={isUnderfunded ? 'Balance too low to finish' : 'Est. cost to finish'}
          value={formatMoney(stats.estimatedCostCents)}
          hint={`Up to ${formatMoney(stats.maxCostCents)} · balance ${formatMoney(viewer.balanceCents)}`}
          icon={CircleDollarSign}
          tone={isUnderfunded ? 'danger' : undefined}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {stats.totalTasks > 0 && (
            <section className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="font-semibold">Labeling progress</h2>
                  <p className="text-[13px] text-muted-foreground">
                    {stats.completedTasks.toLocaleString('en-US')} of {stats.totalTasks.toLocaleString('en-US')} items finished
                    {stats.disputedTasks > 0 && ` · ${stats.disputedTasks.toLocaleString('en-US')} disputed, review these in the export`}
                  </p>
                </div>
                <span className="text-2xl font-semibold tabular-nums">{progress}%</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </section>
          )}

          <section className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-semibold">Items</h2>
              <span className="text-[13px] text-muted-foreground">First {Math.min(5, dataset.tasks.length)} shown · export for all</span>
            </div>
            {dataset.tasks.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
                <p className="mt-3 font-medium">No items yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Upload a CSV or JSON file with the items you want labeled.</p>
                <Link
                  href={`/dashboard/datasets/${dataset.id}/upload`}
                  className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
                >
                  Upload data
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-[12px] text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="px-5 py-2.5 font-medium">Content</th>
                      <th className="px-5 py-2.5 text-right font-medium">Answers</th>
                      <th className="px-5 py-2.5 text-right font-medium">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {dataset.tasks.map((task) => (
                      <tr key={task.id}>
                        <td className="max-w-md px-5 py-3">
                          <div className="flex items-center gap-2">
                            {task.isValidation && (
                              <span className="shrink-0 rounded bg-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-warning">Check</span>
                            )}
                            {dataset.dataType === 'IMAGE' ? (
                              <a href={task.imageUrls[0] ?? task.content} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">
                                {task.content}
                              </a>
                            ) : (
                              <span className="truncate" title={task.content}>
                                {task.content}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right text-muted-foreground tabular-nums">
                          {task.collectedVotes}
                          {!task.isValidation && ` / ${task.targetVotes}`}
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          {task.status === 'COMPLETED' ? (
                            task.consensusLabel ? (
                              <span className="font-medium text-success">
                                {task.consensusLabel} <span className="text-muted-foreground">· {Math.round((task.agreement ?? 0) * 100)}%</span>
                              </span>
                            ) : (
                              <span className="font-medium text-warning">Tie</span>
                            )
                          ) : task.status === 'DISPUTED' ? (
                            <span className="font-medium text-warning">Disputed</span>
                          ) : (
                            <span className="text-muted-foreground">{task.isValidation ? 'Known answer' : 'In progress'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {stats.totalTasks + stats.goldTasks > 0 && <ClearTasksButton datasetId={dataset.id} canClear={dataset.status !== 'ACTIVE'} />}
        </div>

        <aside className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">Configuration</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-[12px] font-medium text-muted-foreground">Question</dt>
                <dd className="mt-1 font-medium">{dataset.question}</dd>
              </div>
              <div>
                <dt className="text-[12px] font-medium text-muted-foreground">Answer options</dt>
                <dd className="mt-1.5 flex flex-wrap gap-1.5">
                  {dataset.options.map((option) => (
                    <span key={option} className="rounded-md border border-border bg-background px-2 py-0.5 text-[13px]">
                      {option}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="text-[12px] font-medium text-muted-foreground">Instructions for evaluators</dt>
                <dd className="mt-1 text-muted-foreground">
                  <EditableField datasetId={dataset.id} field="description" initialValue={dataset.description ?? ''} placeholder="Add instructions" isMultiline />
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-[12px] font-medium text-muted-foreground">Answers per item</dt>
                  <dd className="mt-1 font-medium">
                    <EditableField datasetId={dataset.id} field="requiredVotes" initialValue={dataset.requiredVotes} type="number" className="max-w-16" />
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-medium text-muted-foreground">Max if answers disagree</dt>
                  <dd className="mt-1 font-medium">
                    <EditableField datasetId={dataset.id} field="maxVotes" initialValue={dataset.maxVotes} type="number" className="max-w-16" />
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-medium text-muted-foreground">Reward per answer</dt>
                  <dd className="mt-1 flex items-center gap-1.5 font-medium">
                    <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatMoney(dataset.rewardCents)}
                  </dd>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">+ {formatMoney(platformFeeCents(dataset.rewardCents))} platform fee</p>
                </div>
              </div>
            </dl>
          </section>

          <QualityPanel dataset={dataset} />

          {shareUrl && (
            <section className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-sky-500" />
                <h2 className="font-semibold">Invite evaluators</h2>
              </div>
              <p className="mt-1 text-[13px] text-muted-foreground">This Telegram link opens this dataset directly.</p>
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-2.5 py-1.5 text-[12px]">{shareUrl}</code>
                <CopyButton value={shareUrl} />
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

function LaunchChecklist({ dataset, balanceCents }: { dataset: OwnerDataset; balanceCents: number }) {
  const { stats } = dataset;
  const neededCents = Math.min(stats.remainingTasks, ACTIVATION_FUNDING_TASKS) * dataset.requiredVotes * chargePerAnswerCents(dataset.rewardCents);
  const checks = [
    { label: 'Items uploaded', done: stats.remainingTasks > 0, hint: stats.remainingTasks > 0 ? `${stats.remainingTasks} waiting` : 'Upload data first' },
    {
      label: 'Check questions added',
      done: stats.liveGoldTasks >= recommendedGold(stats.totalTasks),
      hint: `${stats.liveGoldTasks} of ${recommendedGold(stats.totalTasks)} recommended`,
      optional: true,
    },
    {
      label: 'Balance covers the next batch',
      done: stats.remainingTasks > 0 && balanceCents >= neededCents,
      hint: stats.remainingTasks > 0 ? `${formatMoney(neededCents)} needed` : '—',
    },
  ];
  const ready = checks.every((check) => check.done || check.optional);

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-primary/30 bg-primary/[0.04] p-5 lg:flex-row lg:items-center">
      <div className="lg:w-56">
        <h2 className="font-semibold">Ready to go live?</h2>
        <p className="text-[13px] text-muted-foreground">Paused datasets are hidden from evaluators.</p>
      </div>
      <ul className="grid flex-1 gap-3 sm:grid-cols-3">
        {checks.map((check) => (
          <li key={check.label} className="flex items-start gap-2.5">
            <span
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                check.done ? 'border-success bg-success text-white' : 'border-border',
              )}
            >
              {check.done && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <div>
              <p className="text-sm font-medium">{check.label}</p>
              <p className="text-[12px] text-muted-foreground">{check.hint}</p>
            </div>
          </li>
        ))}
      </ul>
      <GoLiveButton datasetId={dataset.id} disabled={!ready} />
    </section>
  );
}

/** Enough check questions that evaluators rarely run out: 5% of items, at least 20. */
function recommendedGold(totalTasks: number) {
  return Math.max(20, Math.ceil(totalTasks * 0.05));
}

function QualityPanel({ dataset }: { dataset: OwnerDataset }) {
  const { stats } = dataset;
  const recommended = recommendedGold(stats.totalTasks);
  const rows = [
    {
      label: 'Check question accuracy',
      value: stats.goldAccuracy === null ? '—' : `${Math.round(stats.goldAccuracy * 100)}%`,
      hint: 'How often evaluators matched your known answers',
    },
    {
      label: 'Answers per finished item',
      value: stats.votesPerItem === null ? '—' : stats.votesPerItem.toFixed(1),
      hint: `Items start at ${dataset.requiredVotes} answers and get more, up to ${dataset.maxVotes}, only when evaluators disagree`,
    },
    {
      label: 'Active check questions',
      value: `${stats.liveGoldTasks} / ${recommended}`,
      hint:
        stats.liveGoldTasks < recommended
          ? 'Add more: each evaluator sees a check question only once, and well-used ones are retired'
          : 'Each evaluator sees a check question only once; well-used ones are retired',
      warn: stats.liveGoldTasks < recommended,
    },
  ];

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-success" />
        <h2 className="font-semibold">Quality control</h2>
      </div>
      <dl className="mt-4 space-y-4 text-sm">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-[12px] font-medium text-muted-foreground">{row.label}</dt>
              <dd className={cn('font-semibold tabular-nums', row.warn && 'text-warning')}>{row.value}</dd>
            </div>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{row.hint}</p>
          </div>
        ))}
      </dl>
    </section>
  );
}
