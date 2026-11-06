'use client';

import { LayoutGrid, Wallet } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { haptics } from './telegram-provider';

const tabs = [
  { href: '/app', label: 'Tasks', icon: LayoutGrid },
  { href: '/app/wallet', label: 'Wallet', icon: Wallet },
];

/** A floating glass pill; the active tab is a solid pill, like the landing page's call to action. */
export function TabBar() {
  const pathname = usePathname();
  // Labeling is a focused, full-screen flow.
  if (pathname.startsWith('/app/tasks/')) return null;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[calc(var(--tg-safe-area-inset-bottom,env(safe-area-inset-bottom))+14px)]">
      <ul className="pointer-events-auto flex gap-1 rounded-full bg-card/75 p-1.5 shadow-[0_10px_40px_-12px_rgb(0_0_0/0.5)] ring-1 ring-border backdrop-blur-xl">
        {tabs.map((tab) => {
          const active =
            tab.href === '/app' ? pathname === '/app' || pathname.startsWith('/app/history') : pathname.startsWith(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                onClick={() => !active && haptics.selection()}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-11 items-center gap-2 rounded-full px-5 text-[14px] transition-colors duration-200',
                  active ? 'bg-foreground font-medium text-background' : 'text-muted-foreground active:text-foreground',
                )}
              >
                <tab.icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.6} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
