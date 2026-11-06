'use client';

import { useEffect, useRef, type ComponentProps } from 'react';

/**
 * Marks itself data-shown the first time it scrolls into view. The landing visuals key their entrance
 * off that attribute in globals.css (see [data-reveal]), so the motion plays when someone is looking.
 */
export function Reveal({ threshold = 0.3, ...props }: ComponentProps<'div'> & { threshold?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.shown = '';
        observer.disconnect();
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return <div ref={ref} data-reveal="" {...props} />;
}
