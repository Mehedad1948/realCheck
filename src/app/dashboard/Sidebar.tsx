'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  Settings,
  LogOut,
  PlusCircle,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutAction } from '../actions/auth/logout';

// Define the shape of the user data we expect
interface SidebarProps {
  user: {
    id: string;
    email: string;
    role: string;
  } | null;
}

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My Datasets', href: '/dashboard/datasets', icon: Database },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  // Handle Logout
  const handleLogout = async () => {
    await logoutAction();
    // The Server Action handles the redirect to '/', but strict client handling is good practice
  };

  // Generate Initials (e.g., "client@test.com" -> "CL")
  const initials = user?.email 
    ? user.email.substring(0, 2).toUpperCase() 
    : '??';

  // Extract username from email (e.g., "client" from "client@test.com")
  const userName = user?.email ? user.email.split('@')[0] : 'Guest';

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r border-border bg-background text-foreground transition-colors duration-300 sm:flex">

      {/* Logo Area */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-foreground">
          <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
            D
          </div>
          <span>DataLabeler</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            // Check if current path starts with the link href (for nested routes)
            // e.g. /dashboard/datasets/create should keep /dashboard/datasets active
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Quick Action */}
        <div className="mt-6 px-4">
          <Link href="/dashboard/datasets/create">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:brightness-110 active:scale-[0.98] transition-all">
              <PlusCircle className="h-4 w-4" />
              New Dataset
            </button>
          </Link>
        </div>
      </nav>

      {/* User Footer */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          {/* Avatar: Generated from Email Initials */}
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium border border-border select-none">
            {initials}
          </div>

          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-foreground capitalize">
              {userName}
            </p>
            <p className="truncate text-xs text-muted-foreground" title={user?.email}>
              {user?.email}
            </p>
          </div>

          {/* Logout Button Form */}
          <form action={handleLogout}>
            <button
              type="submit"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 p-2 rounded-md transition-colors"
              title="Log out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
