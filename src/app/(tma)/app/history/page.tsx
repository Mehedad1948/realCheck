import type { Metadata } from 'next';
import { HistoryList } from '@/features/tma/history';
import { Screen } from '@/features/tma/ui';

export const metadata: Metadata = { title: 'History' };

export default function HistoryPage() {
  return (
    <Screen>
      <HistoryList />
    </Screen>
  );
}
