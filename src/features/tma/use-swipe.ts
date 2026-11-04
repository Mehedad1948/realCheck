'use client';

import { useRef } from 'react';

const MIN_DISTANCE = 60;

/** Horizontal swipe detection that ignores taps and vertical scrolling. */
export function useSwipe({ onLeft, onRight }: { onLeft: () => void; onRight: () => void }) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onTouchStart: (event: React.TouchEvent) => {
      const touch = event.touches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event: React.TouchEvent) => {
      if (!start.current) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;
      start.current = null;
      if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) onLeft();
      else onRight();
    },
  };
}
