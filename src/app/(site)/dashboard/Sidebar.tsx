'use client';

import { BookOpen, CreditCard, Database, LayoutDashboard, LogOut, Plus } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/site/logo';
import { UserAvatar } from '@/components/user-avatar';
import { useHashParams } from '@/hooks/useHashParams';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/server/actions/auth';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Datasets', href: '/dashboard/datasets', icon: Database },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Guide', href: '/dashboard/guide', icon: BookOpen },
];

type Props = { email: string | null; balanceCents: number; topUpEnabled: boolean };

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href) && !pathname.startsWith('/dashboard/datasets/create');
}

export default function Sidebar({ email, balanceCents, topUpEnabled }: Props) {
  const isActive = useIsActive();
  const { setHashParams } = useHashParams();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-border bg-card/50 sm:flex">
      <div className="flex h-16 items-center px-5">
        <Logo href="/dashboard" />
      </div>

      <div className="px-3 pt-2">
        <Link
          href="/dashboard/datasets/create"
          className="flex h-9 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> New dataset
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
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

      <div className="px-3 pb-3">
        <div className="rounded-xl border border-border bg-background p-4">
          <p className="text-[12px] font-medium text-muted-foreground">Balance</p>
          <p className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums">{formatMoney(balanceCents)}</p>
          <div className="mt-3 flex gap-2">
            {topUpEnabled && (
              <button
                onClick={() => setHashParams({ topUp: true })}
                className="flex-1 rounded-md bg-primary/10 py-1.5 text-[13px] font-medium text-primary transition-colors hover:bg-primary/15"
              >
                Add funds
              </button>
            )}
            <Link href="/dashboard/billing" className="flex-1 rounded-md border border-border py-1.5 text-center text-[13px] font-medium transition-colors hover:bg-accent">
              History
            </Link>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <UserAvatar name={email ?? ''} size={32} />
        <p className="min-w-0 flex-1 truncate text-sm" title={email ?? undefined}>
          {email}
        </p>
        <form action={logoutAction}>
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

export function MobileNav({ balanceCents }: { balanceCents: number }) {
  const isActive = useIsActive();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-xl sm:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Logo href="/dashboard" />
        <Link href="/dashboard/billing" className="rounded-full border border-border px-3 py-1 text-sm font-medium tabular-nums">
          {formatMoney(balanceCents)}
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-full px-3 py-1.5 text-sm whitespace-nowrap',
              isActive(item.href) ? 'bg-foreground text-background' : 'text-muted-foreground',
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
