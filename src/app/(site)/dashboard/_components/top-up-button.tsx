'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHashParams } from '@/hooks/useHashParams';

/** Opens the TopUpModal, which is mounted by the dashboard layout. */
export function TopUpButton({ variant = 'default' }: { variant?: 'default' | 'outline' }) {
  const { setHashParams } = useHashParams();
  return (
    <Button variant={variant} onClick={() => setHashParams({ topUp: true })}>
      <Plus /> Add funds
    </Button>
  );
}
