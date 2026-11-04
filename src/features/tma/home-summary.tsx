'use client';

import { ChevronRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { formatMoney } from '@/lib/money';
import { OpenInTelegram } from './open-in-telegram';
import { useMe } from './queries';
import { useTelegram } from './telegram-provider';
import { UserAvatar } from './ui';

function greeting() {
  const hour = new Date().getHours();
  return hour < 5 ? 'Good evening' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export function HomeHeader() {
  const { user, status } = useTelegram();
  const me = useMe();
  const name = user?.first_name ?? me.data?.firstName ?? (status === 'dev' ? 'Dev' : null);

  return (
    <header className="flex items-center gap-3 px-1 pt-2 pb-5">
      <UserAvatar name={name ?? 'RealCheck'} photoUrl={user?.photo_url ?? me.data?.photoUrl} />
      <div className="min-w-0">
        <p className="text-[13px] text-muted-foreground">{name ? greeting() : 'RealCheck'}</p>
        <h1 className="truncate text-[22px] leading-tight font-bold tracking-tight">{name ?? 'Label data, get paid'}</h1>
      </div>
    </header>
  );
}

export function HomeSummary() {
  const { status } = useTelegram();
  const me = useMe();

  if (status === 'browser') return <OpenInTelegram />;

  if (status === 'pending' || me.isPending) {
    return <div className="h-[132px] animate-pulse rounded-2xl bg-card" />;
  }

  if (me.isError) {
    return (
      <div className="rounded-2xl bg-card p-4 text-sm">
        <p className="text-destructive">{me.error.message}</p>
        <button onClick={() => me.refetch()} className="mt-2 font-medium text-accent-text">
          Try again
        </button>
      </div>
    );
  }

  const profile = me.data;
  const accuracy = profile.accuracy === null ? null : Math.round(profile.accuracy * 100);

  return (
    <div className="space-y-3">
      <Link
        href="/app/wallet"
        className="relative block overflow-hidden rounded-2xl bg-primary p-5 text-primary-foreground shadow-sm transition-transform active:scale-[0.99]"
      >
        <div className="pointer-events-none absolute -top-16 -right-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-center justify-between text-[13px] opacity-85">
          <span>Balance</span>
          <span className="flex items-center gap-0.5">
            Wallet <ChevronRight className="h-4 w-4" />
          </span>
        </div>
        <p className="mt-1 text-[40px] leading-none font-bold tracking-tight tabular-nums">
          {formatMoney(profile.balanceCents)}
        </p>
        <div className="mt-4 flex gap-6 text-[13px]">
          <Stat label="Answers" value={profile.tasksDone.toLocaleString('en-US')} />
          <Stat label="Accuracy" value={accuracy === null ? '—' : `${accuracy}%`} />
          <Stat label="Reputation" value={String(profile.reputation)} />
        </div>
      </Link>

      {!profile.canLabel && (
        <div className="flex gap-3 rounded-2xl bg-card p-4 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 text-destructive" />
          <p>
            <span className="font-semibold">New tasks are paused.</span>{' '}
            <span className="text-muted-foreground">Your accuracy on check questions fell too low.</span>
          </p>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="opacity-75">{label}</p>
      <p className="text-[15px] font-semibold tabular-nums">{value}</p>
    </div>
  );
}
