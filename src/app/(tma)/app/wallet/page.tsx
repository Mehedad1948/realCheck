import type { Metadata } from 'next';
import { Screen } from '@/features/tma/ui';
import { WalletView } from '@/features/tma/wallet-view';

export const metadata: Metadata = { title: 'Wallet' };

export default function WalletPage() {
  return (
    <Screen>
      <WalletView />
    </Screen>
  );
}
