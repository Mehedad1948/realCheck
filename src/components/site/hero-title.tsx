'use client';

import { useRef } from 'react';
import VariableProximity from '@/components/site/variable-proximity';
import { robotoFlex } from '@/fonts/roboto-flex';
import { cn } from '@/lib/utils';

// Roboto Flex's weight and optical size axes are what the proximity effect animates.

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
