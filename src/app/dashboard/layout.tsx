import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react'; // Mobile menu icon

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50/50">
            {/* Sidebar - Hidden on Mobile, Visible on Desktop */}
            <Sidebar />

            {/* Mobile Header */}
            <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-white px-4 sm:hidden">
                <button className="mr-4 text-slate-500">
                    <Menu className="h-6 w-6" />
                </button>
                <span className="font-bold text-lg">DataLabeler</span>
            </header>

            {/* Main Content Area - Padded Left on Desktop */}
            <main className="sm:pl-64">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
