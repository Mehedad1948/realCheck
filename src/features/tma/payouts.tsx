'use client';

import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import { ArrowUpRight, Hourglass, Loader2, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api/client';
import type { Payouts as PayoutsData, WithdrawalStatus, WithdrawalSummary } from '@/lib/api/types';
import { dollarsToCents, formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { useLinkWallet, usePayouts, useRequestWithdrawal } from './queries';
import { haptics } from './telegram-provider';
import { IconTile, Row, Section, SkeletonRows } from './ui';

// Getting paid: link a TON wallet (proven with ton_proof), then ask for a withdrawal.
// Withdrawals are reviewed by hand and sent in USDT by scripts/payouts.ts.

const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, '');

/** Loaded on the client only: TON Connect needs `window`. */
export function Payouts() {
  const [manifestUrl] = useState(() => `${window.location.origin}/tonconnect-manifest.json`);
  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      // Wallets opened from the Mini App send the evaluator back to Telegram afterwards.
      actionsConfiguration={botUsername ? { twaReturnUrl: `https://t.me/${botUsername}` } : undefined}
    >
      <PayoutsSection />
    </TonConnectUIProvider>
  );
}

const shortAddress = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`;
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}

function PayoutsSection() {
  const payouts = usePayouts();
  const [tonConnectUI] = useTonConnectUI();
  const link = useLinkWallet();
  const [connecting, setConnecting] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const { mutate: linkWallet } = link;

  // When a wallet connects with a signed proof, link it on the server. The TON Connect
  // session itself isn't needed afterwards: payouts only need the proven address.
  useEffect(
    () =>
      tonConnectUI.onStatusChange((wallet) => {
        const item = wallet?.connectItems?.tonProof;
        if (!wallet || !item || !('proof' in item)) return;
        linkWallet(
          {
            address: wallet.account.address,
            network: wallet.account.chain,
            walletStateInit: wallet.account.walletStateInit,
            proof: item.proof,
          },
          {
            onSuccess: () => {
              haptics.notify('success');
              toast.success('Wallet connected');
            },
            onError: (error) => {
              haptics.notify('error');
              toast.error('Couldn’t connect this wallet', { description: errorMessage(error) });
            },
            onSettled: () => {
              setConnecting(false);
              tonConnectUI.disconnect().catch(() => {});
            },
          },
        );
      }),
    [tonConnectUI, linkWallet],
  );

  useEffect(
    () =>
      tonConnectUI.onModalStateChange((state) => {
        if (state.status === 'closed' && state.closeReason === 'action-cancelled') setConnecting(false);
      }),
    [tonConnectUI],
  );

  const connect = async () => {
    setConnecting(true);
    try {
      const { payload } = await api<{ payload: string }>('/api/tma/wallet/proof');
      if (tonConnectUI.connected) await tonConnectUI.disconnect();
      tonConnectUI.setConnectRequestParameters({ state: 'ready', value: { tonProof: payload } });
      await tonConnectUI.openModal();
    } catch (error) {
      setConnecting(false);
      toast.error('Couldn’t open your wallet', { description: errorMessage(error) });
    }
  };

  if (payouts.isPending) {
    return (
      <Section title="Payouts">
        <SkeletonRows count={3} />
      </Section>
    );
  }
  if (payouts.isError) {
    return (
      <Section title="Payouts">
        <p className="p-4 text-sm text-destructive">{payouts.error.message}</p>
      </Section>
    );
  }

  const data = payouts.data;
  const open = data.withdrawals.find((w) => w.status === 'REQUESTED' || w.status === 'APPROVED' || w.status === 'SENDING');
  const busy = connecting || link.isPending;
  const withdrawBlocker = !data.canWithdraw
    ? 'Paused for this account'
    : !data.wallet
      ? 'Connect a wallet first'
      : open
        ? 'One withdrawal at a time'
        : data.balanceCents < data.minWithdrawalCents
          ? `Minimum ${formatMoney(data.minWithdrawalCents)}`
          : null;

  return (
    <>
      <Section
        title="Payouts"
        footer={`New earnings are held for a few days while answers are checked, then become available. Payouts are sent in ${data.asset} on TON after a quick review.`}
      >
        <Row
          icon={
            <IconTile>
              <Hourglass />
            </IconTile>
          }
          title="Pending"
          subtitle={data.nextReleaseAt ? `Next release ${dateFormat.format(new Date(data.nextReleaseAt))}` : 'Nothing on hold'}
          trailing={<span className="tabular-nums">{formatMoney(data.pendingCents)}</span>}
        />
        <Row
          icon={
            <IconTile>
              <Wallet />
            </IconTile>
          }
          title={data.wallet ? 'Payout wallet' : 'Connect a TON wallet'}
          subtitle={data.wallet ? shortAddress(data.wallet.address) : `Where your ${data.asset} is sent`}
          trailing={
            <Button size="sm" variant={data.wallet ? 'ghost' : 'default'} onClick={connect} disabled={busy || Boolean(open)}>
              {busy && <Loader2 className="animate-spin" />}
              {data.wallet ? 'Change' : 'Connect'}
            </Button>
          }
        />
        <Row
          icon={
            <IconTile>
              <ArrowUpRight />
            </IconTile>
          }
          title="Withdraw"
          subtitle={withdrawBlocker ?? `${formatMoney(data.balanceCents)} available`}
          trailing={
            <Button size="sm" onClick={() => setWithdrawOpen(true)} disabled={Boolean(withdrawBlocker)}>
              Withdraw
            </Button>
          }
        />
      </Section>

      {data.withdrawals.length > 0 && (
        <Section title="Withdrawals">
          {data.withdrawals.map((withdrawal) => (
            <WithdrawalRow key={withdrawal.id} withdrawal={withdrawal} payouts={data} />
          ))}
        </Section>
      )}

      {data.wallet && <WithdrawDrawer open={withdrawOpen} onOpenChange={setWithdrawOpen} payouts={data} />}
    </>
  );
}

const STATUS: Record<WithdrawalStatus, { label: string; tone: 'wait' | 'ok' | 'bad' }> = {
  REQUESTED: { label: 'In review', tone: 'wait' },
  APPROVED: { label: 'Approved', tone: 'wait' },
  SENDING: { label: 'Sending', tone: 'wait' },
  SENT: { label: 'Paid', tone: 'ok' },
  REJECTED: { label: 'Declined, refunded', tone: 'bad' },
  FAILED: { label: 'Failed, refunded', tone: 'bad' },
};

function WithdrawalRow({ withdrawal, payouts }: { withdrawal: WithdrawalSummary; payouts: PayoutsData }) {
  const status = STATUS[withdrawal.status];
  const explorer = payouts.network === 'testnet' ? 'https://testnet.tonviewer.com' : 'https://tonviewer.com';
  const date = dateFormat.format(new Date(withdrawal.createdAt));
  return (
    <Row
      title={
        <span className="tabular-nums">
          {formatMoney(withdrawal.amountCents)} <span className="font-normal text-muted-foreground">{payouts.asset}</span>
        </span>
      }
      subtitle={
        withdrawal.txHash ? (
          <a href={`${explorer}/transaction/${withdrawal.txHash}`} target="_blank" rel="noopener noreferrer" className="underline">
            {date} · view transfer
          </a>
        ) : (
          `${date} · to ${shortAddress(withdrawal.address)}`
        )
      }
      trailing={
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[12px] font-medium',
            status.tone === 'ok' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300',
            status.tone === 'wait' && 'bg-muted text-muted-foreground',
            status.tone === 'bad' && 'bg-destructive/10 text-destructive',
          )}
        >
          {status.label}
        </span>
      }
    />
  );
}

function WithdrawDrawer({
  open,
  onOpenChange,
  payouts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payouts: PayoutsData;
}) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {/* Keyed by `open` so each opening starts from the full available balance. */}
        <WithdrawForm key={String(open)} payouts={payouts} onDone={() => onOpenChange(false)} />
      </DrawerContent>
    </Drawer>
  );
}

function WithdrawForm({ payouts, onDone }: { payouts: PayoutsData; onDone: () => void }) {
  const withdraw = useRequestWithdrawal();
  const fullAmount = (payouts.balanceCents / 100).toFixed(2);
  const [amount, setAmount] = useState(fullAmount);

  const cents = dollarsToCents(Number(amount) || 0);
  const problem =
    cents < payouts.minWithdrawalCents
      ? `The minimum is ${formatMoney(payouts.minWithdrawalCents)}.`
      : cents > payouts.balanceCents
        ? `You have ${formatMoney(payouts.balanceCents)} available.`
        : null;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (problem) return;
    withdraw.mutate(cents, {
      onSuccess: () => {
        haptics.notify('success');
        toast.success('Withdrawal requested', { description: 'You’ll see it here once it’s reviewed and sent.' });
        onDone();
      },
      onError: (error) => {
        haptics.notify('error');
        toast.error('Withdrawal not requested', { description: errorMessage(error) });
      },
    });
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-lg">
      <DrawerHeader className="text-left">
        <DrawerTitle>Withdraw {payouts.asset}</DrawerTitle>
        <DrawerDescription>
          To {payouts.wallet ? shortAddress(payouts.wallet.address) : 'your wallet'} on TON. Network fees are on us.
        </DrawerDescription>
      </DrawerHeader>
      <div className="px-4">
        <label htmlFor="withdraw-amount" className="text-[13px] text-muted-foreground">
          Amount in USD
        </label>
        <div className="mt-1.5 flex items-center gap-2">
          <Input
            id="withdraw-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^\d.]/g, ''))}
            className="h-11 text-lg tabular-nums"
            aria-invalid={Boolean(problem) || undefined}
          />
          <Button type="button" variant="outline" className="h-11" onClick={() => setAmount(fullAmount)}>
            Max
          </Button>
        </div>
        <p className={cn('mt-2 text-[12.5px]', problem ? 'text-destructive' : 'text-muted-foreground')}>
          {problem ?? `${formatMoney(payouts.balanceCents)} available · minimum ${formatMoney(payouts.minWithdrawalCents)}`}
        </p>
      </div>
      <DrawerFooter>
        <Button type="submit" className="h-11" disabled={Boolean(problem) || withdraw.isPending}>
          {withdraw.isPending && <Loader2 className="animate-spin" />}
          Withdraw {formatMoney(cents)}
        </Button>
      </DrawerFooter>
    </form>
  );
}
