import { ArrowDownLeft, ArrowUpRight, Receipt, TrendingDown, Wallet } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { EmptyState } from '@/components/site/empty-state';
import { PageHeader } from '@/components/site/page-header';
import { StatCard } from '@/components/site/stat-card';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { requireClientPage } from '@/server/auth/dal';
import { env } from '@/server/env';
import { getOwnerBilling } from '@/server/queries/owner';
import { ContentSkeleton } from '../_components/skeletons';
import { TopUpButton } from '../_components/top-up-button';

export const metadata: Metadata = { title: 'Billing' };

const dateFormat = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

export default function BillingPage() {
  const topUpEnabled = env().ENABLE_DEMO_TOP_UP;
  return (
    <div className="space-y-8">
      <PageHeader
        title="Billing"
        description="Your balance pays evaluators for each answer they submit. You’re only charged for answers received."
        actions={topUpEnabled && <TopUpButton />}
      />
      <Suspense fallback={<ContentSkeleton />}>
        <Billing topUpEnabled={topUpEnabled} />
      </Suspense>
    </div>
  );
}

async function Billing({ topUpEnabled }: { topUpEnabled: boolean }) {
  const viewer = await requireClientPage();
  const { history, totals, spendByDataset } = await getOwnerBilling(viewer.id);
  const maxSpend = Math.max(1, ...spendByDataset.map((d) => d.spentCents));

  return (
    <div className="space-y-8">

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Available balance" value={formatMoney(viewer.balanceCents)} icon={Wallet} />
        <StatCard label="Spent, last 7 days" value={formatMoney(totals.spentLastWeekCents)} icon={TrendingDown} />
        <StatCard label="Total spent" value={formatMoney(totals.spentCents)} icon={ArrowUpRight} />
        <StatCard label="Total funded" value={formatMoney(totals.fundedCents)} icon={ArrowDownLeft} />
      </div>

      {!topUpEnabled && (
        <p className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          Online payments are being set up. To add funds in the meantime, contact your account manager.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">History</h2>
            <p className="text-[13px] text-muted-foreground">Charges are grouped per dataset per day.</p>
          </div>
          {history.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={Receipt} title="No transactions yet" description="Top-ups and charges for answers will appear here." />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {history.map((item) => {
                const credit = item.amountCents > 0;
                return (
                  <li key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        credit ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {credit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.datasetId ? (
                        <Link href={`/dashboard/datasets/${item.datasetId}`} className="block truncate text-sm font-medium hover:underline">
                          {item.label}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-medium">{item.label}</p>
                      )}
                      <p className="text-[13px] text-muted-foreground">
                        {dateFormat.format(item.date)}
                        {item.answers !== undefined && ` · ${item.answers.toLocaleString('en-US')} answers`}
                      </p>
                    </div>
                    <span className={cn('text-sm font-semibold tabular-nums', credit && 'text-success')}>
                      {credit ? '+' : '−'}
                      {formatMoney(Math.abs(item.amountCents))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="h-fit rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Spend by dataset</h2>
          {spendByDataset.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Nothing spent yet.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {spendByDataset.map((row) => (
                <li key={row.datasetId}>
                  <div className="flex justify-between gap-3 text-sm">
                    <Link href={`/dashboard/datasets/${row.datasetId}`} className="truncate hover:underline">
                      {row.title}
                    </Link>
                    <span className="font-medium tabular-nums">{formatMoney(row.spentCents)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(row.spentCents / maxSpend) * 100}%` }} />
                  </div>
                  <p className="mt-1 text-[12px] text-muted-foreground">{row.answers.toLocaleString('en-US')} answers</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
