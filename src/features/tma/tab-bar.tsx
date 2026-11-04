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

export function TabBar() {
  const pathname = usePathname();
  // Labeling is a focused, full-screen flow.
  if (pathname.startsWith('/app/tasks/')) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/85 pb-[var(--tg-safe-area-inset-bottom,env(safe-area-inset-bottom))] backdrop-blur-xl">
      <ul className="mx-auto flex h-[var(--tab-bar-height)] max-w-lg">
        {tabs.map((tab) => {
          const active = tab.href === '/app' ? pathname === '/app' : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                onClick={() => !active && haptics.selection()}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  active ? 'text-accent-text' : 'text-muted-foreground',
                )}
              >
                <tab.icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
