'use client';

import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';
import { cn } from '@/lib/utils';

// Loaded in its own chunk on the client only, so the shader code never blocks the first paint.
const Silk = dynamic(() => import('./silk'), { ssr: false });

// Phones and tablets get a still frame of the silk instead of the shader (.silk-still in globals.css,
// which must use the same query). On those GPUs the live shader stutters, can drift in color, and the
// frosted panel over it has to re-blur the canvas on every frame.
const STILL_QUERY = '(max-width: 767px), (pointer: coarse), (pointer: none)';

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(STILL_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

/** Animated silk that fills its nearest positioned parent. Fades in once WebGL is ready. */
export function SilkBackground({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  // False on the server, so the shader only mounts once the client knows it's on a desktop.
  const live = useSyncExternalStore(subscribe, () => !window.matchMedia(STILL_QUERY).matches, () => false);

  // The container renders identically on server and client; only the client-only shader depends on the theme.
  return (
    <>
      <div aria-hidden className="silk-still pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 opacity-60 dark:opacity-70',
          className,
        )}
      >
        {live && (
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
        )}
      </div>
    </>
  );
}
