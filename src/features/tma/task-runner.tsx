'use client';

import { ArrowLeft, Check, ChevronLeft, ChevronRight, Loader2, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { SwipeWrapper } from '@/components/tools/SwipeWrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/client';
import type { PublicDataset, TaskBatch, TaskCard } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import { datasetStartParam } from '@/lib/telegram';
import { cn } from '@/lib/utils';
import { OpenInTelegram } from './open-in-telegram';
import { useSubmitVote, useTaskBatch } from './queries';
import { haptics, useBackButton, useTelegram } from './telegram-provider';

export function TaskRunner({ dataset }: { dataset: PublicDataset }) {
  const router = useRouter();
  const { status } = useTelegram();
  const batch = useTaskBatch(dataset.id);
  const goHome = useCallback(() => router.push('/app'), [router]);
  useBackButton(goHome);

  let body: React.ReactNode;
  if (status === 'browser') {
    body = <OpenInTelegram startParam={datasetStartParam(dataset.id)} />;
  } else if (status === 'pending' || batch.isPending) {
    body = <Skeleton className="h-[60vh] w-full rounded-xl" />;
  } else if (batch.isError) {
    body = <BatchError error={batch.error} onRetry={() => batch.refetch()} />;
  } else if (batch.data.tasks.length === 0) {
    body = (
      <EndState
        title="You’re all caught up"
        description="You’ve answered every task available in this dataset for now."
      />
    );
  } else {
    // Keyed by fetch time so each new batch starts a fresh session.
    body = (
      <BatchSession
        key={batch.dataUpdatedAt}
        dataset={dataset}
        batch={batch.data}
        onNextBatch={() => batch.refetch()}
        isLoadingNext={batch.isFetching}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-[var(--tg-viewport-stable-height,100dvh)] max-w-md flex-col gap-4 p-4">
      {status !== 'telegram' && (
        <Link href="/app" className="flex w-fit items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> All tasks
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
  isLoadingNext,
}: {
  dataset: PublicDataset;
  batch: TaskBatch;
  onNextBatch: () => void;
  isLoadingNext: boolean;
}) {
  const { tasks } = batch;
  const vote = useSubmitVote();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [earnedCents, setEarnedCents] = useState(0);
  const [stopped, setStopped] = useState<string | null>(null);
  const [endedEarly, setEndedEarly] = useState(false);

  const task = tasks[index];
  const answeredCount = Object.values(answers).filter((a) => a.state !== 'saving').length;
  const saving = Object.values(answers).some((a) => a.state === 'saving');
  const finished = (answeredCount === tasks.length || endedEarly) && !saving;

  const go = (delta: number) => setIndex((i) => Math.min(tasks.length - 1, Math.max(0, i + delta)));

  const settle = (taskId: string, answer: Answer | null) =>
    setAnswers((prev) => {
      const next = { ...prev };
      if (answer) next[taskId] = answer;
      else delete next[taskId];
      return next;
    });

  const submit = (card: TaskCard, selection: string) => {
    if (answers[card.id] || stopped) return;
    haptics.impact('light');
    settle(card.id, { selection, state: 'saving' });
    // Move on right away; the vote is saved in the background.
    const position = tasks.indexOf(card);
    if (position < tasks.length - 1) setTimeout(() => setIndex(position + 1), 150);

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
            toast('That task filled up before your answer arrived. No worries, keep going.');
            return settle(card.id, { selection, state: 'closed' });
          }
          haptics.notify('error');
          if (code === 'DATASET_UNAVAILABLE' || code === 'FORBIDDEN' || code === 'UNAUTHORIZED') {
            settle(card.id, null);
            setStopped(error.message);
            return;
          }
          // Transient failure: undo and send the evaluator back to retry.
          settle(card.id, null);
          setIndex(position);
          toast.error('Your answer wasn’t saved', { description: error.message });
        },
      },
    );
  };

  if (stopped) return <EndState title="Labeling paused" description={stopped} earnedCents={earnedCents} />;

  if (finished) {
    return (
      <EndState
        title="Batch complete"
        description={`You answered ${answeredCount} task${answeredCount === 1 ? '' : 's'}.`}
        earnedCents={earnedCents}
        celebrate
        action={
          <Button className="w-full" onClick={onNextBatch} disabled={isLoadingNext}>
            {isLoadingNext && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Next batch
          </Button>
        }
      />
    );
  }

  const answer = answers[task.id];

  return (
    <>
      <div>
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>
            Task {index + 1} of {tasks.length}
          </span>
          <span className="font-medium text-primary">+{formatMoney(dataset.rewardCents)} each</span>
        </div>
        <Progress value={(answeredCount / tasks.length) * 100} className="h-2" />
      </div>

      <SwipeWrapper onSwipeLeft={() => go(1)} onSwipeRight={() => go(-1)} className="flex flex-1 flex-col">
        <Card className="flex flex-1 flex-col justify-between">
          <div>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{dataset.question}</CardTitle>
                <Badge variant="secondary" className="text-[10px] uppercase">
                  {dataset.dataType.toLowerCase()}
                </Badge>
              </div>
              {dataset.description && <p className="text-sm text-muted-foreground">{dataset.description}</p>}
            </CardHeader>
            <CardContent className="select-none">
              <TaskContent task={task} />
              {/* Warm the cache for the next image so it appears instantly. */}
              {tasks[index + 1]?.imageUrls[0] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={tasks[index + 1].imageUrls[0]} alt="" className="hidden" referrerPolicy="no-referrer" />
              )}
            </CardContent>
          </div>

          <CardFooter className="flex flex-col gap-4">
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              {dataset.options.map((option) => {
                const selected = answer?.selection === option;
                return (
                  <Button
                    key={option}
                    onClick={() => submit(task, option)}
                    disabled={Boolean(answer)}
                    variant={selected ? 'default' : 'outline'}
                    className={cn('h-12 text-base active:scale-95', selected && 'ring-2 ring-primary/30 disabled:opacity-100')}
                  >
                    {selected && answer.state === 'saving' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {selected && answer.state === 'saved' && <Check className="mr-2 h-4 w-4" />}
                    {option}
                  </Button>
                );
              })}
            </div>

            <div className="flex w-full justify-between border-t pt-2">
              <Button variant="ghost" size="sm" onClick={() => go(-1)} disabled={index === 0}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Prev
              </Button>
              {index < tasks.length - 1 ? (
                <Button variant="ghost" size="sm" onClick={() => go(1)}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setEndedEarly(true)} disabled={saving}>
                  Finish <Check className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </SwipeWrapper>
    </>
  );
}

function TaskContent({ task }: { task: TaskCard }) {
  if (task.imageUrls.length > 0) {
    return (
      <div className="pointer-events-none space-y-3">
        {task.imageUrls.map((url) => (
          <div key={url} className="relative aspect-video w-full overflow-hidden rounded-md border bg-muted">
            {/* Client-supplied URLs on arbitrary hosts, so next/image's allow-list doesn't fit. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="Item to label" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <blockquote className="pointer-events-none rounded-lg border bg-secondary/40 p-5 text-lg leading-relaxed">
      {task.content}
    </blockquote>
  );
}

function BatchError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  const status = error instanceof ApiError ? error.status : 0;
  return (
    <EndState
      title={status === 409 ? 'Not available right now' : status === 403 ? 'Tasks paused' : 'Couldn’t load tasks'}
      description={error.message}
      action={
        status >= 500 || status === 0 ? (
          <Button variant="outline" className="w-full" onClick={onRetry}>
            Try again
          </Button>
        ) : undefined
      }
    />
  );
}

function EndState({
  title,
  description,
  earnedCents,
  celebrate,
  action,
}: {
  title: string;
  description: string;
  earnedCents?: number;
  celebrate?: boolean;
  action?: React.ReactNode;
}) {
  return (
    <Card className="mt-8">
      <CardContent className="flex flex-col items-center gap-3 text-center">
        {celebrate && <PartyPopper className="h-10 w-10 text-primary" />}
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        {earnedCents !== undefined && earnedCents > 0 && (
          <p className="text-2xl font-bold text-primary">+{formatMoney(earnedCents)}</p>
        )}
        <div className="mt-2 flex w-full flex-col gap-2">
          {action}
          <Button asChild variant="ghost" className="w-full">
            <Link href="/app">Back to all tasks</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
