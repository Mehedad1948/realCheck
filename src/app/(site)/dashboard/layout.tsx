import { Suspense, type ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { requireClientPage } from '@/server/auth/dal';
import { env } from '@/server/env';
import Sidebar, { MobileNav } from './Sidebar';
import { TopUpModal } from './TopUpModal';

// The frame is static and prerendered. Anything that depends on the signed-in
// client streams in inside Suspense. Pages check auth themselves too, because
// layouts don't re-render on client-side navigation.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card sm:block" />}>
        <DashboardChrome />
      </Suspense>
      <main className="sm:pl-64">
        <div className="container mx-auto max-w-7xl p-4 md:p-8">
          <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
        </div>
      </main>
    </div>
  );
}

async function DashboardChrome() {
  const viewer = await requireClientPage();
  const topUpEnabled = env().ENABLE_DEMO_TOP_UP;
  return (
    <>
      <Sidebar email={viewer.email} balanceCents={viewer.balanceCents} topUpEnabled={topUpEnabled} />
      <MobileNav balanceCents={viewer.balanceCents} />
      {topUpEnabled && <TopUpModal balanceCents={viewer.balanceCents} />}
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
