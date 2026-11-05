'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';

// Loaded in its own chunk on the client only, so the shader code never blocks the first paint.
const Silk = dynamic(() => import('./silk'), { ssr: false });

/** Animated silk behind the landing page hero. Fades in once WebGL is ready and out towards the content. */
export function SilkBackground() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  // The container renders identically on server and client; only the client-only shader depends on the theme.
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[min(100svh,900px)] mask-[linear-gradient(to_bottom,#000_45%,transparent)] opacity-70 dark:opacity-60"
    >
      <Silk
        color={dark ? '#4f46e5' : '#c7d2fe'}
        sheenColor={dark ? '#c4b5fd' : '#ffffff'}
        lightMode={!dark}
        speed={2.5}
        scale={1}
        rotation={-0.35}
        depth={0.6}
        sheen={0.45}
        // Glow needs an extra render pass plus mipmap generation every frame; skip it.
        glow={0}
        noiseIntensity={0.6}
        mouseInteraction
        interactionStrength={0.6}
        clickRipple={false}
        // The folds are soft, so rendering at under 1x and upscaling is not visible but cuts pixel work by more than half.
        dpr={0.6}
        maxFps={30}
      />
    </div>
  );
}
