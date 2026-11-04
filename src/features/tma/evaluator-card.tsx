'use client';

import { CheckCircle2, ShieldAlert, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/money';
import { OpenInTelegram } from './open-in-telegram';
import { useMe } from './queries';
import { useTelegram } from './telegram-provider';

export function EvaluatorCard() {
  const { status } = useTelegram();
  const me = useMe();

  if (status === 'browser') return <OpenInTelegram />;

  if (status === 'pending' || me.isPending) {
    return <Skeleton className="h-44 w-full rounded-xl" />;
  }

  if (me.isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-destructive">{me.error.message}</p>
          <Button size="sm" variant="outline" onClick={() => me.refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  const profile = me.data;
  const accuracy = profile.accuracy === null ? null : Math.round(profile.accuracy * 100);

  return (
    <div className="space-y-4">
      <Card className="border-none bg-primary text-primary-foreground shadow-md">
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm opacity-80">Balance</p>
              <p className="mt-1 text-4xl font-bold tabular-nums">{formatMoney(profile.balanceCents)}</p>
              <p className="mt-1 text-xs opacity-80">{profile.tasksDone} answers submitted</p>
            </div>
            <div className="rounded-full bg-white/15 p-2">
              <Wallet className="h-6 w-6" />
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full border-none bg-white/15 text-primary-foreground hover:bg-white/25"
            disabled
          >
            Withdrawals coming soon
          </Button>
        </CardContent>
      </Card>

      {!profile.canLabel && (
        <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          Your accuracy on check questions is too low, so new tasks are paused for your account.
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Accuracy
          </span>
          <span className="font-semibold tabular-nums">{accuracy === null ? 'Not rated yet' : `${accuracy}%`}</span>
        </div>
        <Progress value={accuracy ?? 0} className="h-2" />
        <p className="text-right text-xs text-muted-foreground">
          Measured on check questions with known answers. Reputation {profile.reputation}.
        </p>
      </div>
    </div>
  );
}
