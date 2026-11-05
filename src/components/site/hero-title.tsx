'use client';

import localFont from 'next/font/local';
import { useRef } from 'react';
import VariableProximity from '@/components/site/variable-proximity';
import { cn } from '@/lib/utils';

// Roboto Flex (latin, variable weight and optical size: the axes the proximity effect animates).
// Committed rather than fetched from Google at build time, so dev and builds work offline or behind
// a proxy. Preloaded only on pages that render this component.
const robotoFlex = localFont({
  src: '../../fonts/roboto-flex-latin.woff2',
  weight: '100 1000',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

const REST = "'wght' 260, 'opsz' 96";
const NEAR = "'wght' 760, 'opsz' 144";

/** The landing headline. Letters thicken as the cursor passes over them. */
export function HeroTitle({ className }: { className?: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const shared = { containerRef: titleRef, fromFontVariationSettings: REST, toFontVariationSettings: NEAR, radius: 170, falloff: 'gaussian', smoothing: 0.35 } as const;

  return (
    <h1 ref={titleRef} className={cn(robotoFlex.className, className)}>
      <span className="block">
        <VariableProximity label="Training data" {...shared} />
      </span>
      <span className="block">
        {/* The second line rests dimmer and brightens under the cursor along with the weight change. */}
        <VariableProximity
          label="you can trust."
          {...shared}
          fromColor="color-mix(in oklab, var(--foreground) 50%, transparent)"
          toColor="var(--foreground)"
        />
      </span>
    </h1>
  );
}
