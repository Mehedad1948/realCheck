'use client';

import { History, LayoutGrid, LogOut, Send, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/site/logo';
import { UserAvatar } from '@/components/user-avatar';
import { useMe } from '@/features/tma/queries';
import { formatMoney } from '@/lib/money';
import { botUrl } from '@/lib/telegram';
import { cn } from '@/lib/utils';
import { evaluatorLogoutAction } from '@/server/actions/evaluator-auth';

const navItems = [
  { name: 'Tasks', href: '/earn', icon: LayoutGrid },
  { name: 'History', href: '/earn/history', icon: History },
  { name: 'Wallet', href: '/earn/wallet', icon: Wallet },
];

const telegramUrl = botUrl(process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME);

type Props = { name: string; username: string | null };

function useIsActive() {
  const pathname = usePathname();
  // Labeling a dataset is part of Tasks.
  return (href: string) => (href === '/earn' ? pathname === href || pathname.startsWith('/earn/tasks') : pathname.startsWith(href));
}

/** The balance, read live: it moves with every answer, unlike the server-rendered frame around it. */
function Balance({ className }: { className?: string }) {
  const me = useMe();
  if (!me.data) return <span className={cn('inline-block h-6 w-16 animate-pulse rounded bg-muted', className)} />;
  return <span className={cn('tabular-nums', className)}>{formatMoney(me.data.balanceCents)}</span>;
}

/** Desktop navigation for evaluators labeling on the website, matching the client dashboard's sidebar. */
export default function EarnSidebar({ name, username }: Props) {
  const isActive = useIsActive();
  const me = useMe();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-border bg-card/50 sm:flex">
      <div className="flex h-16 items-center px-5">
        <Logo href="/earn" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    active ? 'bg-accent font-medium text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                  )}
                >
                  <item.icon className={cn('h-4 w-4', active && 'text-primary')} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="space-y-2 px-3 pb-3">
        <Link href="/earn/wallet" className="block rounded-xl border border-border bg-background p-4 transition-colors hover:bg-accent/40">
          <p className="text-[12px] font-medium text-muted-foreground">Available</p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight">
            <Balance />
          </p>
          {me.data && me.data.pendingCents > 0 && (
            <p className="mt-1 text-[12px] text-muted-foreground tabular-nums">+ {formatMoney(me.data.pendingCents)} pending</p>
          )}
        </Link>
        {telegramUrl && (
          <a
            href={telegramUrl}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          >
            <Send className="h-3.5 w-3.5" /> Also in Telegram
          </a>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <UserAvatar name={name} size={32} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">{name}</p>
          {username && <p className="truncate text-[12px] text-muted-foreground">@{username}</p>}
        </div>
        <form action={evaluatorLogoutAction}>
          <button
            type="submit"
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}

export function EarnMobileNav() {
  const isActive = useIsActive();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl sm:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Logo href="/earn" />
        <Link href="/earn/wallet" className="rounded-full border border-border px-3 py-1 text-sm font-medium">
          <Balance />
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn('rounded-full px-3 py-1.5 text-sm whitespace-nowrap', isActive(item.href) ? 'bg-foreground text-background' : 'text-muted-foreground')}
          >
            {item.name}
          </Link>
        ))}
        <form action={evaluatorLogoutAction} className="ml-auto">
          <button type="submit" className="rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground">
            Sign out
          </button>
        </form>
      </nav>
    </header>
  );
}
