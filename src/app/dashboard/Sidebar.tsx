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
import { cn } from '@/lib/utils'; // Assuming you have a utils file, or remove cn and use template literals

const navItems = [
  { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { name: 'My Datasets', href: '/client/dashboard/datasets', icon: Database },
  { name: 'Billing', href: '/client/dashboard/billing', icon: CreditCard },
  { name: 'Settings', href: '/client/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-white text-slate-900 sm:flex">
      {/* Logo Area */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 rounded bg-blue-600 text-white flex items-center justify-center">
            D
          </div>
          <span>DataLabeler</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive 
                      ? "bg-slate-100 text-blue-600" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>
        
        {/* Quick Action */}
        <div className="mt-6 px-4">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-all">
                <PlusCircle className="h-4 w-4" />
                New Dataset
            </button>
        </div>
      </nav>

      {/* User Footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
            CL
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-slate-900">Client Name</p>
            <p className="truncate text-xs text-slate-500">client@company.com</p>
          </div>
          <button className="text-slate-400 hover:text-red-500">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
