import { ReactNode, Suspense } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react'; // Mobile menu icon
import ThemeToggle from '@/components/ui/ThemeToggle.tsx';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: ReactNode }) {

    return (


        <div className="min-h-screen ">

            {/* Sidebar - Hidden on Mobile, Visible on Desktop */}
            <Suspense>
                {(async () => {
                    const session = await getSession();
                    
                    // Double check security (Middleware handles this, but good for type safety)
                    if (!session || session.role !== "CLIENT") {
                        redirect("/login");
                    }
                    return <Sidebar user={session} />
                })()}

            </Suspense>

            {/* Mobile Header */}
            <header className="sticky top-0 z-20 flex h-16 items-center border-b  px-4 sm:hidden">
                <button className="mr-4 text-slate-500">
                    <Menu className="h-6 w-6" />
                </button>
                <span className="font-bold text-lg">DataLabeler</span>
                <span className='grow'></span>

            </header>

            {/* Main Content Area - Padded Left on Desktop */}
            <main className="sm:pl-64">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    <Suspense>
                        {children}
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
