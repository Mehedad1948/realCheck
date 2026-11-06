import { cn } from '@/lib/utils';

/** Initials from a name ("Ada Lovelace" → "AL") or the first two letters of an email address. */
function initialsOf(name: string) {
  const words = name.split('@')[0].split(/[\s._-]+/).filter(Boolean);
  const initials = words.length > 1 ? words[0][0] + words[1][0] : (words[0] ?? '').slice(0, 2);
  return initials.toUpperCase();
}

/**
 * The account avatar, in the brand's silk palette: a deep indigo disc lit from the top left, a fine
 * glossy rim, and thin Roboto Flex initials. Always a monogram, never a photo: Telegram may hand over a
 * generated bright-blue placeholder that can't be told apart from a real photo and clashes with the rest.
 */
export function UserAvatar({ name, size = 44, className }: { name: string; size?: number; className?: string }) {
  return (
    <div
      className={cn(
        'relative isolate flex shrink-0 items-center justify-center overflow-hidden rounded-full text-white select-none',
        'bg-[radial-gradient(circle_at_30%_20%,#818cf8_0%,#4f46e5_38%,#1e1b4b_78%,#0b0a14_100%)]',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span
        className="font-display font-[300] tracking-[0.02em] text-white/95"
        style={{ fontSize: Math.round(size * 0.36), lineHeight: 1 }}
      >
        {initialsOf(name) || '?'}
      </span>
      {/* Glossy rim: a bright hairline at the top fading out toward the bottom, like the silk's sheen. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.35),inset_0_0_0_1px_rgb(255_255_255/0.12)]"
      />
    </div>
  );
}
