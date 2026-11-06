'use client';

import { ArrowUpRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { UserAvatar } from '@/components/user-avatar';
import { formatMoney } from '@/lib/money';
import { OpenInTelegram } from './open-in-telegram';
import { useMe } from './queries';
import { useTelegram } from './telegram-provider';
import { SilkCard } from './silk-card';
import { Display, Money, Surface } from './ui';

function greeting() {
  const hour = new Date().getHours();
  return hour < 5 ? 'Good evening' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export function HomeHeader() {
  const { user, status } = useTelegram();
  const me = useMe();
  const name = user?.first_name ?? me.data?.firstName ?? (status === 'dev' ? 'Dev' : null);

  return (
    <header className="flex items-center gap-3.5 px-1 pt-3 pb-6">
      <UserAvatar name={name ?? 'RealCheck'} size={48} />
      <div className="min-w-0">
        <p className="text-[13px] text-muted-foreground">{name ? greeting() : 'RealCheck'}</p>
        <h1 className="truncate text-[28px] leading-[1.1]">
          <Display>{name ?? 'Label data, get paid'}</Display>
        </h1>
      </div>
    </header>
  );
}

export function HomeSummary() {
  const { status } = useTelegram();
  const me = useMe();

  if (status === 'browser') return <OpenInTelegram />;

  if (status === 'pending' || me.isPending) {
    return <div className="h-[196px] animate-pulse rounded-[28px] bg-card ring-1 ring-border ring-inset" />;
  }

  if (me.isError) {
    return (
      <Surface className="p-4 text-sm">
        <p className="text-destructive">{me.error.message}</p>
        <button onClick={() => me.refetch()} className="mt-2 font-medium text-accent-text">
          Try again
        </button>
      </Surface>
    );
  }

  const profile = me.data;
  const accuracy = profile.accuracy === null ? null : Math.round(profile.accuracy * 100);

  return (
    <div className="space-y-3">
      <Link href="/app/wallet" className="block transition-transform duration-200 active:scale-[0.985]">
        <SilkCard className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-white/60">Balance</span>
            <span className="flex items-center gap-1 rounded-full bg-white/10 py-1 pr-2 pl-3 text-[12px] text-white/85 ring-1 ring-white/10 backdrop-blur-md">
              Wallet <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
          </div>
          <p className="mt-3 text-[52px] leading-none">
            <Money value={formatMoney(profile.balanceCents)} />
          </p>
          <div className="mt-7 grid grid-cols-3 border-t border-white/10 pt-4">
            <Stat label="Answers" value={profile.tasksDone.toLocaleString('en-US')} />
            <Stat label="Accuracy" value={accuracy === null ? '—' : `${accuracy}%`} />
            <Stat label="Reputation" value={String(profile.reputation)} />
          </div>
        </SilkCard>
      </Link>

      {!profile.canLabel && (
        <Surface className="flex gap-3 p-4 text-sm">
          <ShieldAlert className="h-5 w-5 shrink-0 text-destructive" strokeWidth={1.75} />
          <p>
            <span className="font-medium">New tasks are paused.</span>{' '}
            <span className="text-muted-foreground">Your accuracy on check questions fell too low.</span>
          </p>
        </Surface>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-white/50">{label}</p>
      <p className="mt-0.5 text-[17px] tabular-nums">{value}</p>
    </div>
  );
}
