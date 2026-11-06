'use client';

import { ArrowUpRight, Award, CheckCircle2, Clock, Coins, Target } from 'lucide-react';
import { formatMoney } from '@/lib/money';
import { MIN_REPUTATION } from '@/lib/constants';
import type { EarningsEntry } from '@/lib/api/types';
import { OpenInTelegram } from './open-in-telegram';
import { useEarnings, useMe } from './queries';
import { useTelegram } from './telegram-provider';
import { IconTile, Money, Row, Section, SkeletonRows, Surface } from './ui';

export function WalletView() {
  const { status } = useTelegram();
  const me = useMe();
  const earnings = useEarnings();

  if (status === 'browser') return <OpenInTelegram />;

  const profile = me.data;
  const accuracy = profile?.accuracy == null ? null : Math.round(profile.accuracy * 100);

  return (
    <>
      <div className="px-1 pt-6 pb-8 text-center">
        <p className="text-[13px] text-muted-foreground">Available balance</p>
        {profile ? (
          <p className="mt-2 text-[64px] leading-none">
            <Money value={formatMoney(profile.balanceCents)} />
          </p>
        ) : (
          <div className="mx-auto mt-3 h-16 w-48 animate-pulse rounded-2xl bg-card" />
        )}
      </div>

      <Surface className="grid grid-cols-3 divide-x divide-border">
        <PeriodTile label="Today" cents={earnings.data?.todayCents} />
        <PeriodTile label="7 days" cents={earnings.data?.weekCents} />
        <PeriodTile label="All time" cents={earnings.data?.totalCents} />
      </Surface>

      <Section title="Payouts" footer="Withdrawals to your wallet are coming soon. Your balance is safe until then.">
        <Row
          icon={
            <IconTile>
              <ArrowUpRight />
            </IconTile>
          }
          title="Withdraw"
          trailing={<span className="text-[13px]">Coming soon</span>}
          className="opacity-60"
        />
      </Section>

      <Section
        title="Performance"
        footer={`Accuracy is measured on check questions with known answers. Below ${MIN_REPUTATION} reputation, new tasks pause.`}
      >
        <Row
          icon={
            <IconTile>
              <CheckCircle2 />
            </IconTile>
          }
          title="Answers submitted"
          trailing={profile ? profile.tasksDone.toLocaleString('en-US') : '…'}
        />
        <Row
          icon={
            <IconTile>
              <Target />
            </IconTile>
          }
          title="Accuracy"
          trailing={profile ? (accuracy === null ? 'Not rated yet' : `${accuracy}%`) : '…'}
        />
        <Row
          icon={
            <IconTile>
              <Award />
            </IconTile>
          }
          title="Reputation"
          trailing={profile ? String(profile.reputation) : '…'}
        />
      </Section>

      <Section title="Recent activity">
        {earnings.isPending ? (
          <SkeletonRows count={4} />
        ) : earnings.isError ? (
          <p className="p-4 text-sm text-destructive">{earnings.error.message}</p>
        ) : earnings.data.recent.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <Clock className="h-9 w-9 text-muted-foreground/60" strokeWidth={1.25} />
            <p className="mt-3 text-[17px] font-[450]">No earnings yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Your paid answers will show up here.</p>
          </div>
        ) : (
          <ActivityList entries={earnings.data.recent} />
        )}
      </Section>
    </>
  );
}

function PeriodTile({ label, cents }: { label: string; cents?: number }) {
  return (
    <div className="px-3 py-4 text-center">
      <p className="text-[12px] text-muted-foreground">{label}</p>
      {cents === undefined ? (
        <div className="mx-auto mt-1.5 h-6 w-14 animate-pulse rounded bg-muted" />
      ) : (
        <p className="mt-1 text-[20px] leading-tight">
          <Money value={formatMoney(cents)} />
        </p>
      )}
    </div>
  );
}

const dayFormat = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

function ActivityList({ entries }: { entries: EarningsEntry[] }) {
  return entries.map((entry) => {
    const date = new Date(entry.createdAt);
    const positive = entry.amountCents >= 0;
    return (
      <Row
        key={entry.id}
        icon={
          <IconTile className={positive ? undefined : 'bg-muted text-muted-foreground ring-border'}>
            <Coins />
          </IconTile>
        }
        title={entry.datasetTitle ?? 'Adjustment'}
        subtitle={`${dayFormat.format(date)} · ${timeFormat.format(date)}`}
        trailing={
          <span className={positive ? 'font-medium text-emerald-600 tabular-nums dark:text-emerald-300' : 'tabular-nums'}>
            {positive ? '+' : ''}
            {formatMoney(entry.amountCents)}
          </span>
        }
      />
    );
  });
}
