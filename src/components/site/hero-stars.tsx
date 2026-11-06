'use client';

import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import StarBorder from './star-border';

/**
 * Two stars running opposite ways around the landing silk panel. Fills the panel's outline layer
 * (.hero-frame-border) and takes its corner radius from --frame-radius, which changes per breakpoint.
 */
export function HeroStars() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== 'light';
  const ref = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState(36);

  useEffect(() => {
    const read = () => {
      if (!ref.current) return;
      const value = parseFloat(getComputedStyle(ref.current).getPropertyValue('--frame-radius'));
      if (!Number.isNaN(value)) setRadius(value);
    };
    read();
    window.addEventListener('resize', read);
    return () => window.removeEventListener('resize', read);
  }, []);

  const shared = {
    as: 'div' as const,
    radius,
    theme: dark ? ('dark' as const) : ('light' as const),
    color: dark ? '#ffffff' : '#4f46e5',
    trailColor: dark ? '#818cf8' : '#a5b4fc',
    duration: 12,
    trailLength: 0.12,
    glow: 0.8,
    sparkle: true,
    hover: 'none' as const,
    clickPulse: false,
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    // Inline so it wins over the component's own relative/inline-flex/padding classes.
    style: { position: 'absolute', inset: -1, padding: 0 } as const,
  };

  return (
    <div ref={ref} aria-hidden className="hero-stars absolute inset-0">
      <StarBorder {...shared} direction="clockwise" />
      <StarBorder {...shared} direction="counterclockwise" />
    </div>
  );
}
