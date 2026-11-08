import { Suspense, type ReactNode } from 'react';
import { QueryProvider } from '@/components/providers/query-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { WebEvaluatorProvider } from '@/features/tma/telegram-provider';
import { requireEvaluatorPage } from '@/server/auth/dal';
import EarnSidebar, { EarnMobileNav } from './EarnSidebar';

// The evaluator workspace on the website: the Mini App's screens (tasks, history, wallet) inside a
// dashboard frame. Everything private is fetched on the client from the same /api/tma routes the
// Mini App uses, authenticated by the session cookie, so the pages themselves hold nothing private.
export default function EarnLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <WebEvaluatorProvider>
        <div className="min-h-screen bg-background">
          <Suspense fallback={<div className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card sm:block" />}>
            <EarnChrome />
          </Suspense>
          <main className="sm:pl-64">
            <div className="mx-auto max-w-6xl p-4 md:p-8">
              <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
            </div>
          </main>
        </div>
      </WebEvaluatorProvider>
    </QueryProvider>
  );
}

async function EarnChrome() {
  const viewer = await requireEvaluatorPage();
  const name = [viewer.firstName, viewer.lastName].filter(Boolean).join(' ') || (viewer.username ? `@${viewer.username}` : 'Evaluator');
  return (
    <>
      <EarnSidebar name={name} username={viewer.username} />
      <EarnMobileNav />
    </>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Skeleton className="h-52 rounded-[28px]" />
        <Skeleton className="h-80 rounded-[22px]" />
      </div>
    </div>
  );
}
