import type { Metadata } from 'next';
import { HistoryList } from '@/features/tma/history';

export const metadata: Metadata = { title: 'History' };

export default function EarnHistoryPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <HistoryList />
    </div>
  );
}
