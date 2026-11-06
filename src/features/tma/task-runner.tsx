'use client';

import { Check, ChevronDown, ChevronLeft, ChevronRight, Info, Loader2, Maximize2, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/client';
import type { PublicDataset, TaskBatch, TaskCard } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import { datasetStartParam } from '@/lib/telegram';
import { cn } from '@/lib/utils';
import { OpenInTelegram } from './open-in-telegram';
import { useSubmitVote, useTaskBatch } from './queries';
import { haptics, useBackButton, useMainButton, useTelegram } from './telegram-provider';
import { Money } from './ui';
import { useSwipe } from './use-swipe';

export function TaskRunner({ dataset }: { dataset: PublicDataset }) {
  const router = useRouter();
  const { status } = useTelegram();
  const batch = useTaskBatch(dataset.id);
  const goHome = useCallback(() => router.push('/app'), [router]);
  const { refetch } = batch;
  const nextBatch = useCallback(() => void refetch(), [refetch]);
  useBackButton(goHome);

  let body: React.ReactNode;
  if (status === 'browser') {
    body = (
      <div className="pt-6">
        <OpenInTelegram startParam={datasetStartParam(dataset.id)} />
      </div>
    );
  } else if (status === 'pending' || batch.isPending) {
    body = <RunnerSkeleton />;
  } else if (batch.isError) {
    body = <BatchError error={batch.error} onRetry={nextBatch} />;
  } else if (batch.data.tasks.length === 0) {
    body = (
      <EndState
        tone="neutral"
        title="You’re all caught up"
        description="You’ve answered everything available in this dataset. Try another one."
        primary={{ label: 'Browse tasks', onClick: goHome }}
      />
    );
  } else {
    // Keyed by fetch time so each new batch starts a fresh session.
    body = (
      <BatchSession
        key={batch.dataUpdatedAt}
        dataset={dataset}
        batch={batch.data}
        onNextBatch={nextBatch}
        onExit={goHome}
        isLoadingNext={batch.isFetching}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-[var(--tg-viewport-stable-height,100dvh)] w-full max-w-lg flex-col px-4 pt-3 pb-6">
      {status !== 'telegram' && (
        <Link
          href="/app"
          aria-label="Close"
          className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-card text-muted-foreground ring-1 ring-border ring-inset"
        >
          <X className="h-4 w-4" />
        </Link>
      )}
      {body}
    </div>
  );
}

type Answer = { selection: string; state: 'saving' | 'saved' | 'closed' };

function BatchSession({
  dataset,
  batch,
  onNextBatch,
  onExit,
  isLoadingNext,
}: {
  dataset: PublicDataset;
  batch: TaskBatch;
  onNextBatch: () => void;
  onExit: () => void;
  isLoadingNext: boolean;
}) {
  const { tasks } = batch;
  const vote = useSubmitVote();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [earnedCents, setEarnedCents] = useState(0);
  const [stopped, setStopped] = useState<string | null>(null);
  const [endedEarly, setEndedEarly] = useState(false);

  const task = tasks[index];
  const answer = answers[task.id];
  const settledCount = Object.values(answers).filter((a) => a.state !== 'saving').length;
  const saving = Object.values(answers).some((a) => a.state === 'saving');
  const finished = (settledCount === tasks.length || endedEarly) && !saving;

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= tasks.length || next === index) return;
      setDirection(next > index ? 'forward' : 'back');
      setIndex(next);
      haptics.selection();
    },
    [index, tasks.length],
  );

  const settle = (taskId: string, value: Answer | null) =>
    setAnswers((prev) => {
      const next = { ...prev };
      if (value) next[taskId] = value;
      else delete next[taskId];
      return next;
    });

  const submit = (card: TaskCard, selection: string) => {
    if (answers[card.id] || stopped) return;
    haptics.impact('light');
    settle(card.id, { selection, state: 'saving' });
    const position = tasks.indexOf(card);
    // Advance after the press animation; the vote saves in the background.
    const nextUnanswered = tasks.findIndex((t, i) => i > position && !answers[t.id]);
    if (nextUnanswered !== -1) {
      setTimeout(() => {
        setDirection('forward');
        setIndex(nextUnanswered);
      }, 260);
    }

    vote.mutate(
      { taskId: card.id, selection },
      {
        onSuccess: (result) => {
          settle(card.id, { selection, state: 'saved' });
          setEarnedCents((cents) => cents + result.rewardCents);
        },
        onError: (error) => {
          const code = error instanceof ApiError ? error.code : null;
          if (code === 'ALREADY_ANSWERED') return settle(card.id, { selection, state: 'saved' });
          if (code === 'TASK_CLOSED') {
            toast('That one filled up just before your answer. Keep going!');
            return settle(card.id, { selection, state: 'closed' });
          }
          haptics.notify('error');
          settle(card.id, null);
          if (code === 'DATASET_UNAVAILABLE' || code === 'FORBIDDEN' || code === 'UNAUTHORIZED') {
            setStopped(error.message);
            return;
          }
          setDirection('back');
          setIndex(position);
          toast.error('Your answer wasn’t saved', { description: error.message });
        },
      },
    );
  };

  // Keyboard support for desktop Telegram: 1-9 answer, arrows navigate.
  useEffect(() => {
    if (finished || stopped) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const number = Number(event.key);
      if (number >= 1 && number <= dataset.options.length) submit(task, dataset.options[number - 1]);
      else if (event.key === 'ArrowRight') goTo(index + 1);
      else if (event.key === 'ArrowLeft') goTo(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const swipe = useSwipe({ onLeft: () => goTo(index + 1), onRight: () => goTo(index - 1) });

  if (stopped) {
    return (
      <EndState tone="neutral" title="Labeling paused" description={stopped} earnedCents={earnedCents} primary={{ label: 'Browse tasks', onClick: onExit }} />
    );
  }

  if (finished) {
    const answered = Object.values(answers).length;
    return (
      <EndState
        tone="success"
        title="Batch complete"
        description={`${answered} answer${answered === 1 ? '' : 's'} submitted. Nice work.`}
        earnedCents={earnedCents}
        primary={{ label: 'Continue labeling', onClick: onNextBatch, loading: isLoadingNext }}
        secondary={{ label: 'Back to tasks', onClick: onExit }}
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ProgressHeader tasks={tasks} answers={answers} index={index} earnedCents={earnedCents} onJump={goTo} />

      <div className="mt-5">
        <p className="text-[13px] text-muted-foreground">{dataset.title}</p>
        <h1 className="mt-1.5 text-[26px] leading-[1.15] font-[320] tracking-[-0.025em]">{dataset.question}</h1>
        {dataset.description && <Instructions text={dataset.description} />}
      </div>

      <div {...swipe} className="mt-4 flex flex-1 flex-col">
        <div
          key={task.id}
          className={cn(
            'animate-in duration-300 fade-in',
            direction === 'forward' ? 'slide-in-from-right-6' : 'slide-in-from-left-6',
          )}
        >
          <TaskContent task={task} next={tasks[index + 1]} />

          <div className="mt-4 space-y-2" role="group" aria-label="Answers">
            {dataset.options.map((option, i) => {
              const selected = answer?.selection === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => submit(task, option)}
                  disabled={Boolean(answer)}
                  aria-pressed={selected}
                  className={cn(
                    'flex min-h-[56px] w-full items-center gap-3 rounded-full pr-5 pl-2.5 text-left text-[16px] transition-all duration-200',
                    selected
                      ? 'animate-pop bg-foreground font-medium text-background'
                      : 'bg-card ring-1 ring-border ring-inset active:scale-[0.98] active:bg-accent',
                    answer && !selected && 'opacity-45',
                  )}
                >
                  <span
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] tabular-nums',
                      selected ? 'bg-background/15' : 'text-muted-foreground ring-1 ring-border ring-inset',
                    )}
                  >
                    {selected && answer.state === 'saving' ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : selected ? (
                      <Check className="h-4 w-4" strokeWidth={3} />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className="flex-1">{option}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <footer className="mt-5 flex items-center justify-between text-[13px] text-muted-foreground">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="flex h-9 items-center gap-1 rounded-full px-3 disabled:opacity-0"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <span>{answer ? 'Answer saved' : 'Answers are final'}</span>
        {index < tasks.length - 1 ? (
          <button type="button" onClick={() => goTo(index + 1)} className="flex h-9 items-center gap-1 rounded-full px-3">
            Skip <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setEndedEarly(true)}
            disabled={saving}
            className="flex h-9 items-center gap-1 rounded-full px-3 font-medium text-accent-text disabled:opacity-50"
          >
            Finish <Check className="h-4 w-4" />
          </button>
        )}
      </footer>
    </div>
  );
}

function ProgressHeader({
  tasks,
  answers,
  index,
  earnedCents,
  onJump,
}: {
  tasks: TaskCard[];
  answers: Record<string, Answer>;
  index: number;
  earnedCents: number;
  onJump: (index: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-muted-foreground tabular-nums">
          {index + 1} of {tasks.length}
        </span>
        <span
          key={earnedCents}
          className="animate-in rounded-full px-2.5 py-0.5 font-medium text-emerald-600 tabular-nums ring-1 ring-emerald-500/25 duration-300 ring-inset zoom-in-90 dark:text-emerald-300"
        >
          +{formatMoney(earnedCents)}
        </span>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden>
        {tasks.map((t, i) => (
          <button
            key={t.id}
            type="button"
            tabIndex={-1}
            onClick={() => onJump(i)}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              answers[t.id] ? 'bg-primary' : i === index ? 'bg-foreground/40' : 'bg-foreground/10',
            )}
          />
        ))}
      </div>
    </div>
  );
}

function Instructions({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className="mt-2 flex w-full items-start gap-2 text-left text-[14px] text-muted-foreground"
      aria-expanded={open}
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span className={cn('flex-1', !open && 'line-clamp-1')}>{text}</span>
      <ChevronDown className={cn('mt-0.5 h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
    </button>
  );
}

function TaskContent({ task, next }: { task: TaskCard; next?: TaskCard }) {
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [zoomed, setZoomed] = useState<string | null>(null);

  if (task.imageUrls.length > 0) {
    return (
      <div className="space-y-2">
        {task.imageUrls.map((url) => (
          <button
            key={url}
            type="button"
            onClick={() => setZoomed(url)}
            className="relative block aspect-[4/3] w-full overflow-hidden rounded-[22px] bg-card ring-1 ring-border ring-inset"
            aria-label="View full size"
          >
            {!loaded[url] && <div className="absolute inset-0 animate-pulse bg-muted" />}
            {/* Client-supplied URLs on arbitrary hosts, so next/image's allow-list doesn't fit. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Item to label"
              referrerPolicy="no-referrer"
              onLoad={() => setLoaded((l) => ({ ...l, [url]: true }))}
              className={cn('h-full w-full object-contain transition-opacity duration-300', loaded[url] ? 'opacity-100' : 'opacity-0')}
            />
            <span className="absolute right-2 bottom-2 rounded-full bg-black/45 p-1.5 text-white backdrop-blur">
              <Maximize2 className="h-3.5 w-3.5" />
            </span>
          </button>
        ))}
        {/* Warm the cache so the next image appears instantly. */}
        {next?.imageUrls[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={next.imageUrls[0]} alt="" className="hidden" referrerPolicy="no-referrer" />
        )}
        {zoomed && (
          <button
            type="button"
            onClick={() => setZoomed(null)}
            className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/95 p-2 duration-200 fade-in"
            aria-label="Close full size view"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomed} alt="Item to label, full size" className="max-h-full max-w-full object-contain" referrerPolicy="no-referrer" />
          </button>
        )}
      </div>
    );
  }

  return (
    <blockquote className="rounded-[22px] bg-card px-5 py-5 text-[17px] leading-relaxed whitespace-pre-wrap ring-1 ring-border ring-inset">
      {task.content}
    </blockquote>
  );
}

function RunnerSkeleton() {
  return (
    <div className="space-y-4 pt-1">
      <div className="h-4 w-full animate-pulse rounded bg-card" />
      <div className="h-7 w-3/4 animate-pulse rounded-lg bg-card" />
      <div className="h-40 animate-pulse rounded-[22px] bg-card" />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="h-[56px] animate-pulse rounded-full bg-card" />
      ))}
    </div>
  );
}

function BatchError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const router = useRouter();
  const status = error instanceof ApiError ? error.status : 0;
  const retryable = status >= 500 || status === 0;
  return (
    <EndState
      tone="neutral"
      title={status === 409 ? 'Not available right now' : status === 403 ? 'Tasks paused' : 'Couldn’t load tasks'}
      description={error.message}
      primary={retryable ? { label: 'Try again', onClick: onRetry } : { label: 'Browse tasks', onClick: () => router.push('/app') }}
    />
  );
}

type Action = { label: string; onClick: () => void; loading?: boolean };

function EndState({
  tone,
  title,
  description,
  earnedCents,
  primary,
  secondary,
}: {
  tone: 'success' | 'neutral';
  title: string;
  description: string;
  earnedCents?: number;
  primary: Action;
  secondary?: Action;
}) {
  // Telegram's native bottom button when available; an in-page button otherwise.
  const native = useMainButton({ text: primary.label, onClick: primary.onClick, loading: primary.loading });

  return (
    <div className="flex flex-1 animate-in flex-col items-center justify-center pb-10 text-center duration-500 fade-in slide-in-from-bottom-4">
      <div
        className={cn(
          'flex h-20 w-20 animate-in items-center justify-center rounded-full ring-1 duration-500 ring-inset zoom-in-50',
          tone === 'success'
            ? 'bg-emerald-500/10 text-emerald-600 shadow-[0_0_60px_-10px] shadow-emerald-500/40 ring-emerald-500/30 dark:text-emerald-300'
            : 'bg-card text-muted-foreground ring-border',
        )}
      >
        {tone === 'success' ? <Check className="h-9 w-9" strokeWidth={1.75} /> : <Info className="h-8 w-8" strokeWidth={1.5} />}
      </div>
      <h2 className="mt-6 text-[32px] leading-tight font-[300] tracking-[-0.03em]">{title}</h2>
      <p className="mt-2 max-w-xs text-[15px] text-muted-foreground">{description}</p>
      {earnedCents !== undefined && earnedCents > 0 && (
        <p className="mt-6 text-[44px] leading-none text-emerald-600 dark:text-emerald-300">
          <Money value={`+${formatMoney(earnedCents)}`} />
        </p>
      )}
      <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
        {!native && (
          <Button size="lg" className="h-12 rounded-full bg-foreground text-[15px] text-background hover:bg-foreground/90" onClick={primary.onClick} disabled={primary.loading}>
            {primary.loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {primary.label}
          </Button>
        )}
        {secondary && (
          <Button variant="ghost" size="lg" className="h-11 rounded-full text-[15px] font-normal text-muted-foreground" onClick={secondary.onClick}>
            {secondary.label}
          </Button>
        )}
      </div>
    </div>
  );
}
