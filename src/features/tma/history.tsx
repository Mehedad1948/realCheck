'use client';

import { Check, Clock, FileText, History as HistoryIcon, Image as ImageIcon, Minus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { DatasetHistory, HistoryAnswer, HistoryDataset, HistoryOutcome } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { OpenInTelegram } from './open-in-telegram';
import { useDatasetHistory, useHistory } from './queries';
import { useBackButton, useTelegram } from './telegram-provider';
import { Display, IconTile, Money, Row, Section, SkeletonRows, Surface } from './ui';

const PREVIEW_ROWS = 3;
const ACCURACY_FOOTER =
  'Accuracy is how often your answer matched the majority once a task had enough answers. Pending answers are still waiting on other people.';

const percent = (share: number) => `${Math.round(share * 100)}%`;

function summaryLine(dataset: HistoryDataset) {
  const parts = [`${dataset.answers.toLocaleString('en-US')} answer${dataset.answers === 1 ? '' : 's'}`];
  if (dataset.accuracy !== null) parts.push(`${percent(dataset.accuracy)} accurate`);
  if (dataset.pending > 0) parts.push(`${dataset.pending} pending`);
  return parts.join(' · ');
}

function Earned({ cents }: { cents: number }) {
  return (
    <span className={cn('tabular-nums', cents > 0 ? 'font-medium text-emerald-600 dark:text-emerald-300' : 'text-muted-foreground')}>
      {cents > 0 ? '+' : ''}
      {formatMoney(cents)}
    </span>
  );
}

function DatasetRow({ dataset }: { dataset: HistoryDataset }) {
  return (
    <Row
      href={`/app/history/${dataset.id}`}
      icon={<IconTile>{dataset.dataType === 'IMAGE' ? <ImageIcon /> : <FileText />}</IconTile>}
      title={dataset.title}
      subtitle={summaryLine(dataset)}
      trailing={<Earned cents={dataset.earnedCents} />}
    />
  );
}

/** Home: the most recent datasets the evaluator worked on. Hidden until there is something to show. */
export function HistoryPreview() {
  const { status } = useTelegram();
  const history = useHistory();

  if (status === 'browser' || history.isError || history.data?.length === 0) return null;

  const rows = history.data?.slice(0, PREVIEW_ROWS);
  const more = (history.data?.length ?? 0) > PREVIEW_ROWS;

  return (
    <Section
      title="Your history"
      action={
        more && (
          <Link href="/app/history" className="text-[13px] text-accent-text">
            See all
          </Link>
        )
      }
    >
      {rows ? rows.map((dataset) => <DatasetRow key={dataset.id} dataset={dataset} />) : <SkeletonRows count={2} />}
    </Section>
  );
}

function useBackTo(href: string) {
  const router = useRouter();
  const back = useCallback(() => router.push(href), [router, href]);
  useBackButton(back);
}

/** `/app/history`: every dataset the evaluator answered in. */
export function HistoryList() {
  const { status } = useTelegram();
  const history = useHistory();
  useBackTo('/app');

  if (status === 'browser') return <OpenInTelegram />;

  const totalCents = history.data?.reduce((sum, dataset) => sum + dataset.earnedCents, 0);

  return (
    <>
      <div className="px-1 pt-6 pb-8 text-center">
        <p className="text-[13px] text-muted-foreground">Earned from labeling</p>
        {totalCents === undefined ? (
          <div className="mx-auto mt-3 h-14 w-40 animate-pulse rounded-2xl bg-card" />
        ) : (
          <p className="mt-2 text-[56px] leading-none">
            <Money value={formatMoney(totalCents)} />
          </p>
        )}
      </div>

      <Section title="Datasets" footer={ACCURACY_FOOTER}>
        {history.isPending ? (
          <SkeletonRows count={4} />
        ) : history.isError ? (
          <p className="p-4 text-sm text-destructive">{history.error.message}</p>
        ) : history.data.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <HistoryIcon className="h-9 w-9 text-muted-foreground/60" strokeWidth={1.25} />
            <p className="mt-3 text-[17px] font-medium">No history yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Datasets you label will show up here.</p>
          </div>
        ) : (
          history.data.map((dataset) => <DatasetRow key={dataset.id} dataset={dataset} />)
        )}
      </Section>
    </>
  );
}

/** `/app/history/[datasetId]`: the evaluator's answers in one dataset and how they turned out. */
export function DatasetHistoryView({ datasetId }: { datasetId: string }) {
  const { status } = useTelegram();
  const history = useDatasetHistory(datasetId);
  useBackTo('/app/history');

  if (status === 'browser') return <OpenInTelegram />;
  if (history.isError) {
    return (
      <Surface className="mt-6 p-4 text-sm">
        <p className="text-destructive">{history.error.message}</p>
        <button onClick={() => history.refetch()} className="mt-2 font-medium text-accent-text">
          Try again
        </button>
      </Surface>
    );
  }
  if (status === 'pending' || history.isPending) {
    return (
      <div className="space-y-4 pt-6">
        <div className="h-4 w-1/2 animate-pulse rounded bg-card" />
        <div className="h-8 w-4/5 animate-pulse rounded bg-card" />
        <div className="h-20 animate-pulse rounded-[22px] bg-card" />
        <SkeletonRows count={5} />
      </div>
    );
  }

  return <DatasetHistoryContent history={history.data} />;
}

function DatasetHistoryContent({ history: { dataset, answers } }: { history: DatasetHistory }) {
  const canContinue = dataset.status === 'ACTIVE' && dataset.remaining > 0;

  return (
    <>
      <div className="px-1 pt-4">
        <p className="text-[13px] text-muted-foreground">{dataset.title}</p>
        <h1 className="mt-1.5 text-[26px] leading-[1.15]">
          <Display className="font-[300] tracking-[-0.025em]">{dataset.question}</Display>
        </h1>
      </div>

      <Surface className="mt-5 grid grid-cols-3 divide-x divide-border">
        <Stat label="Earned">
          <Money value={formatMoney(dataset.earnedCents)} />
        </Stat>
        <Stat label="Accuracy">
          <Display>{dataset.accuracy === null ? '—' : percent(dataset.accuracy)}</Display>
        </Stat>
        <Stat label="Answers">
          <Display>{dataset.answers.toLocaleString('en-US')}</Display>
        </Stat>
      </Surface>

      {canContinue && (
        <Link
          href={`/app/tasks/${dataset.id}`}
          className="mt-4 flex h-12 items-center justify-center rounded-full bg-foreground text-[15px] font-medium text-background transition-transform active:scale-[0.985]"
        >
          Continue labeling · {dataset.remaining} left
        </Link>
      )}

      <Section
        title="Your answers"
        footer={
          answers.length < dataset.answers
            ? `Showing your latest ${answers.length}. ${ACCURACY_FOOTER}`
            : ACCURACY_FOOTER
        }
      >
        {answers.map((answer) => (
          <AnswerRow key={answer.taskId} answer={answer} isImage={dataset.dataType === 'IMAGE'} />
        ))}
      </Section>
    </>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-4 text-center">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-[20px] leading-tight">{children}</p>
    </div>
  );
}

function AnswerRow({ answer, isImage }: { answer: HistoryAnswer; isImage: boolean }) {
  const image = isImage ? (answer.imageUrl ?? answer.content) : null;
  return (
    <Row
      icon={
        image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-[11px] bg-muted object-cover ring-1 ring-border ring-inset"
          />
        ) : undefined
      }
      title={isImage ? `You said ${answer.selection}` : answer.content}
      subtitle={
        isImage
          ? answer.consensusLabel && `Majority said ${answer.consensusLabel}`
          : `You: ${answer.selection}${answer.consensusLabel ? ` · Majority: ${answer.consensusLabel}` : ''}`
      }
      trailing={<OutcomeBadge outcome={answer.outcome} />}
    />
  );
}

const outcomes: Record<HistoryOutcome, { label: string; icon: typeof Check; className: string }> = {
  match: {
    label: 'Matched',
    icon: Check,
    className: 'text-emerald-600 ring-emerald-500/25 dark:text-emerald-300',
  },
  mismatch: { label: 'Differed', icon: X, className: 'text-rose-600 ring-rose-500/25 dark:text-rose-300' },
  tie: { label: 'Split', icon: Minus, className: 'text-muted-foreground ring-border' },
  pending: { label: 'Pending', icon: Clock, className: 'text-muted-foreground ring-border' },
};

function OutcomeBadge({ outcome }: { outcome: HistoryOutcome }) {
  const { label, icon: Icon, className } = outcomes[outcome];
  return (
    <span className={cn('flex items-center gap-1 rounded-full py-1 pr-2.5 pl-2 text-[12px] ring-1 ring-inset', className)}>
      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
      {label}
    </span>
  );
}
