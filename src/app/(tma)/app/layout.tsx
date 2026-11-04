import { Suspense, type ReactNode } from 'react';
import { Onboarding } from '@/features/tma/onboarding';
import { TabBar } from '@/features/tma/tab-bar';

export default function MiniAppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      {/* The tab bar reads the pathname, which is request data on dynamic routes. */}
      <Suspense fallback={null}>
        <TabBar />
      </Suspense>
      <Onboarding />
    </>
  );
}
