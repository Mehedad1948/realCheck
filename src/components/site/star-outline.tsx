'use client';

import { useTheme } from 'next-themes';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import StarBorder, { type StarBorderProps } from './star-border';

type Box = { top: number; left: number; width: number; height: number; radius: number };

type StarOutlineProps = Pick<
  StarBorderProps<'div'>,
  'color' | 'trailColor' | 'duration' | 'thickness' | 'trailLength' | 'stars' | 'glow' | 'sparkle' | 'direction'
> & {
  children: ReactNode;
  /** Classes for the wrapper, which is a positioned block around the child. */
  className?: string;
  /** Corner radius in pixels. Read from the child's border-radius when not set. */
  radius?: number;
};

/**
 * Sends stars around the border of its child. Wrap any single element:
 *
 *   <StarOutline><div className="rounded-2xl border p-6">…</div></StarOutline>
 *
 * The stars follow the child's size, position and corner radius, and are drawn on top of it
 * without catching pointer events. By default two stars start on opposite corners and run the same
 * way, so they never meet.
 */
export function StarOutline({ children, className, radius, ...star }: StarOutlineProps) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== 'light';
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const child = wrapper?.firstElementChild;
    if (!wrapper || !(child instanceof HTMLElement)) return undefined;

    const measure = () => {
      const next: Box = {
        top: child.offsetTop,
        left: child.offsetLeft,
        width: child.offsetWidth,
        height: child.offsetHeight,
        radius: parseFloat(getComputedStyle(child).borderTopLeftRadius) || 0,
      };
      setBox((prev) =>
        prev &&
        prev.top === next.top &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.height === next.height &&
        prev.radius === next.radius
          ? prev
          : next,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(child);
    observer.observe(wrapper);
    measure();
    return () => observer.disconnect();
  }, []);

  const overlay: CSSProperties | undefined = box
    ? { position: 'absolute', top: box.top, left: box.left, width: box.width, height: box.height, padding: 0 }
    : undefined;

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {children}
      {overlay && box && (
        <StarBorder
          as="div"
          aria-hidden
          className="pointer-events-none"
          style={overlay}
          radius={radius ?? box.radius}
          theme={dark ? 'dark' : 'light'}
          color={dark ? '#ffffff' : '#4f46e5'}
          trailColor={dark ? '#818cf8' : '#a5b4fc'}
          stars={2}
          duration={12}
          trailLength={0.12}
          glow={0.8}
          sparkle
          {...star}
          hover="none"
          clickPulse={false}
          backgroundColor="transparent"
          borderColor="transparent"
        />
      )}
    </div>
  );
}
