import { cn } from '@/lib/utils';

/** Initials from a name ("Ada Lovelace" → "AL") or the first two letters of an email address. */
function initialsOf(name: string) {
  const words = name.split('@')[0].split(/[\s._-]+/).filter(Boolean);
  const initials = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '').slice(0, 2);
  return initials.toUpperCase();
}

/**
 * The account avatar: a flat disc in the same quiet indigo tint and hairline ring as the row icon tiles,
 * with thin Roboto Flex initials. Always a monogram, never a photo: Telegram may hand over a generated
 * bright-blue placeholder that can't be told apart from a real photo and clashes with the rest.
 */
export function UserAvatar({ name, size = 44, className }: { name: string; size?: number; className?: string }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-accent-text ring-1 ring-primary/25 select-none ring-inset',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span className="font-display font-[300] tracking-[0.04em]" style={{ fontSize: Math.round(size * 0.36), lineHeight: 1 }}>
        {initialsOf(name) || '?'}
      </span>
    </div>
  );
}
