'use client';

import { History, LayoutGrid, Wallet } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';
import GooeyNav from '@/components/ui/gooey-nav';
import { haptics } from './telegram-provider';

const tabs = [
  { href: '/app', label: 'Tasks', icon: <LayoutGrid strokeWidth={1.75} /> },
  { href: '/app/history', label: 'History', icon: <History strokeWidth={1.75} /> },
  { href: '/app/wallet', label: 'Wallet', icon: <Wallet strokeWidth={1.75} /> },
];
// Buttons rather than links, so switching tabs is a client navigation and never reloads the Mini App.
const items = tabs.map(({ label, icon }) => ({ label, icon }));

const tabIndex = (pathname: string) => {
  const index = tabs.findIndex((tab, i) => (i === 0 ? pathname === tab.href : pathname.startsWith(tab.href)));
  return Math.max(0, index);
};

// The Mini App's theme is the .dark class on <html>, set from Telegram's colorScheme.
function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}
const isDark = () => document.documentElement.classList.contains('dark');

/** A floating glass pill whose active tab melts across like a droplet when switched. */
export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const dark = useSyncExternalStore(subscribeToTheme, isDark, () => true);
  // Move the pill the moment a tab is tapped, not when the next route has rendered.
  const [pending, setPending] = useState<{ index: number; from: string } | null>(null);
  const active = pending?.from === pathname ? pending.index : tabIndex(pathname);

  useEffect(() => {
    for (const tab of tabs) router.prefetch(tab.href);
  }, [router]);

  // Labeling is a focused, full-screen flow.
  if (pathname.startsWith('/app/tasks/')) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center pb-[calc(var(--tg-safe-area-inset-bottom,env(safe-area-inset-bottom))+14px)]">
      <GooeyNav
        items={items}
        activeIndex={active}
        onChange={(index) => {
          haptics.selection();
          setPending({ index, from: pathname });
          router.push(tabs[index].href);
        }}
        theme={dark ? 'dark' : 'light'}
        size="md"
        particleCount={12}
        spread={40}
        animationTime={550}
        timeVariance={250}
        gooeyness={0.55}
        wobble={0.45}
        hoverEffect={false}
        className="pointer-events-auto"
      />
    </div>
  );
}
