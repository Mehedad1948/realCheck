'use client';

import { useRef } from 'react';
import VariableProximity from '@/components/site/variable-proximity';
import { robotoFlex } from '@/fonts/roboto-flex';
import { cn } from '@/lib/utils';

// Roboto Flex's weight and optical size axes are what the proximity effect animates.

const REST = "'wght' 260, 'opsz' 96";
const NEAR = "'wght' 760, 'opsz' 144";

// A slow wave rolls through "data", then hands off to "trust" as it fades. Both share one beat.
const SWEEP = { sweepEvery: 8, sweepLength: 2.4 } as const;

/** The landing headline. Letters thicken as the cursor passes over them, and a wave rolls through "data" then "trust" every few seconds. */
export function HeroTitle({ className }: { className?: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const shared = { containerRef: titleRef, fromFontVariationSettings: REST, toFontVariationSettings: NEAR, radius: 170, falloff: 'gaussian', smoothing: 0.35 } as const;

  return (
    <h1 ref={titleRef} className={cn(robotoFlex.className, className)}>
      <span className="block">
        <VariableProximity label="Training data" {...shared} {...SWEEP} sweepWord={1} />
      </span>
      <span className="block">
        {/* The second line rests dimmer and brightens under the cursor along with the weight change. */}
        <VariableProximity
          label="you can trust."
          {...shared}
          {...SWEEP}
          sweepWord={2}
          sweepDelay={2}
          fromColor="color-mix(in oklab, var(--foreground) 50%, transparent)"
          toColor="var(--foreground)"
        />
      </span>
    </h1>
  );
}
