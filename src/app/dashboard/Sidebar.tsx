'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  Settings,
  LogOut,
  PlusCircle,
  CreditCard,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '../actions/auth/logout';
import { useHashParams } from '@/hooks/useHashParams';

// Updated Interface to include balance
interface SidebarProps {
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
  balance: number; // New prop
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Datasets', href: '/dashboard/datasets', icon: Database },
  { name: 'Guide', href: '/dashboard/guide', icon: CreditCard },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  // { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar({ user, balance }: SidebarProps) {
  const pathname = usePathname();
  const { setHashParams } = useHashParams()
  const handleLogout = async () => {
    await logoutAction();
  };

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : '??';

  const userName = user?.email ? user.email.split('@')[0] : 'Guest';

  // Currency Formatter
  const formattedBalance = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(balance);

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-border bg-card text-card-foreground transition-colors duration-300 sm:flex">

      {/* Logo Area */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
          <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            D
          </div>
          <span className="tracking-tight">DataLabeler</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6">

        {/* Main Links */}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Quick Action Button */}
        <div className="px-1">
          <Link href="/dashboard/datasets/create">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 bg-background px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-all group">
              <PlusCircle className="h-4 w-4 group-hover:scale-110 transition-transform" />
              New Dataset
            </button>
          </Link>
        </div>
      </nav>

      {/* --- NEW: Wallet / Balance Section --- */}
      <div className="px-4 pb-4">
        <div className="bg-muted/40 border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-3 h-3" />
              Available Balance
            </span>
            <button
              onClick={() => { setHashParams({ topUp: true }) }}
              className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded hover:bg-primary/20 transition-colors"
            >
              Top Up
            </button>
          </div>
          <p className="text-lg font-bold text-foreground tracking-tight">
            {formattedBalance}
          </p>
        </div>
      </div>

      {/* User Footer */}
      <div className="border-t border-border p-4 bg-muted/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold border border-primary/20 shadow-sm select-none">
            {initials}
          </div>

          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-foreground capitalize">
              {userName}
            </p>
            <p className="truncate text-xs text-muted-foreground opacity-80" title={user?.email}>
              {user?.email}
            </p>
          </div>

          <form action={handleLogout}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors"
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
