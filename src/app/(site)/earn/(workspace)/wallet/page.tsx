import type { Metadata } from 'next';
import { WalletView } from '@/features/tma/wallet-view';

export const metadata: Metadata = { title: 'Wallet' };

export default function EarnWalletPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <WalletView />
    </div>
  );
}
