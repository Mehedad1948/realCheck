'use client';

import { BookOpen, Database, LayoutDashboard, LogOut, PlusCircle, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useHashParams } from '@/hooks/useHashParams';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { logoutAction } from '@/server/actions/auth';

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Datasets', href: '/dashboard/datasets', icon: Database },
  { name: 'Guide', href: '/dashboard/guide', icon: BookOpen },
];

type Props = { email: string | null; balanceCents: number; topUpEnabled: boolean };

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
}

export default function Sidebar({ email, balanceCents, topUpEnabled }: Props) {
  const isActive = useIsActive();
  const { setHashParams } = useHashParams();
  const initials = email ? email.slice(0, 2).toUpperCase() : '??';

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-border bg-card text-card-foreground sm:flex">
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">R</div>
          <span className="tracking-tight">RealCheck</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/dashboard/datasets/create"
          className="group mx-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <PlusCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
          New Dataset
        </Link>
      </nav>

      <div className="px-4 pb-4">
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Wallet className="h-3 w-3" />
              Balance
            </span>
            {topUpEnabled && (
              <button
                onClick={() => setHashParams({ topUp: true })}
                className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary transition-colors hover:bg-primary/20"
              >
                Top Up
              </button>
            )}
          </div>
          <p className="text-lg font-bold tracking-tight tabular-nums">{formatMoney(balanceCents)}</p>
        </div>
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary select-none">
            {initials}
          </div>
          <p className="min-w-0 flex-1 truncate text-sm font-medium" title={email ?? undefined}>
            {email}
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({ balanceCents }: { balanceCents: number }) {
  const isActive = useIsActive();
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur sm:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold">
          RealCheck
        </Link>
        <span className="text-sm font-semibold tabular-nums">{formatMoney(balanceCents)}</span>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm whitespace-nowrap',
              isActive(item.href) ? 'bg-primary text-primary-foreground' : 'text-muted-foreground',
            )}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
