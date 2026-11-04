// src/app/dashboard/layout.tsx
import { ReactNode, Suspense } from 'react';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // Ensure you import your prisma instance
import { redirect } from 'next/navigation';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import dynamic from 'next/dynamic';
import { TopUpModal } from './TopUpModal';

// const TopUpModal = dynamic(() => import('./TopUpModal'))

export default async function DashboardLayout({ children }: { children: ReactNode }) {

    // 1. Fetch Session
    const session = await getSession();

    // 2. Security Check
    if (!session || session.role !== "CLIENT" || !session.email) {
        redirect("/login");
    }

    // 3. BEST PRACTICE: Fetch fresh balance from DB
    // Session data is often stale. Always fetch financial data fresh on page load.
    const dbUser = await prisma.user.findUnique({
        where: { email: session.email },
        select: { balance: true }
    });

    // Default to 0 if something goes wrong
    const currentBalance = dbUser?.balance ?? 0;

    return (
        <div className="min-h-screen bg-background"> {/* Added bg-background for theme consistency */}

            {/* Sidebar - Pass session AND fresh balance */}
            <Suspense fallback={<div className="w-64 fixed inset-y-0 bg-muted/20" />}>
                <Sidebar user={session} balance={currentBalance} />
            </Suspense>

            <TopUpModal balance={currentBalance} />

            {/* Mobile Header */}
            <header className="sticky top-0 z-20 flex h-16 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 sm:hidden">
                <button className="mr-4 text-muted-foreground">
                    <Menu className="h-6 w-6" />
                </button>
                <span className="font-bold text-lg text-foreground">DataLabeler</span>
                <span className='grow'></span>
            </header>

            {/* Main Content Area */}
            <main className="sm:pl-64 transition-all duration-300">
                <div className="container mx-auto p-4 md:p-8 max-w-7xl">
                    <Suspense>
                        {children}
                    </Suspense>
                </div>
            </main>
        </div>
    );
}
