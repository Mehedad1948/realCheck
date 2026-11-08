import Link from 'next/link';
import { cn } from '@/lib/utils';

// Same shape as public/logo-svg.svg; exported so image routes can draw the mark too.
export const LOGO_PATH =
  'M768.42 1046.16L1297.19 519.898L1300 1122.68L649.519 1497L0 1122.53L0.369717 374.102L650.481 0L1173.63 302.239L769.825 705.397L621.125 559.97L450.907 728.908L768.42 1046.16Z';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1300 1497" aria-hidden className={cn('h-8 w-auto', className)}>
      <path d={LOGO_PATH} fill="#5E5BEA" />
    </svg>
  );
}

export function Logo({ href = '/', className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn('flex items-center gap-2.5 font-semibold tracking-tight', className)}>
      <LogoMark />
      <span className="text-[17px]">RealCheck</span>
    </Link>
  );
}
