import Link from 'next/link';
import { cn } from '@/lib/utils';

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('h-8 w-8', className)}>
      <defs>
        <linearGradient id="rc-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#818cf8" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#rc-mark)" />
      <path d="M9.5 16.5l4.2 4.2L22.5 11.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
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
