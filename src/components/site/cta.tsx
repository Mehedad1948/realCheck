import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Tone = 'primary' | 'telegram' | 'outline';

type CtaProps = {
  children: string;
  tone?: Tone;
  /** Shown at the start in a round badge (the Telegram tone's plane, for instance). */
  badge?: ReactNode;
  /** Trailing icon; an arrow by default. Pass null for none. */
  icon?: ReactNode;
  className?: string;
} & (
  | ({ href: string } & Omit<ComponentProps<'a'>, 'children' | 'className' | 'href'>)
  | ({ href?: undefined } & Omit<ComponentProps<'button'>, 'children' | 'className'>)
);

/**
 * The site's pill call to action (.cta in globals.css). Internal hrefs render a Link, external
 * ones an <a>, and no href a <button>. On hover the label rolls letter by letter.
 */
export function Cta({ children, tone = 'primary', badge, icon, className, ...props }: CtaProps) {
  const content = (
    <>
      {badge && <span className="cta-badge">{badge}</span>}
      <RollText text={children} />
      {icon === undefined ? <ArrowRight aria-hidden className="h-4 w-4" /> : icon}
    </>
  );
  const shared = {
    className: cn('cta h-12 px-7 text-[15px]', className),
    'data-tone': tone,
  };

  if (props.href !== undefined) {
    const { href, ...rest } = props;
    if (href.startsWith('/') || href.startsWith('#')) {
      return (
        <Link href={href} {...rest} {...shared}>
          {content}
        </Link>
      );
    }
    return (
      <a href={href} {...rest} {...shared}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" {...props} {...shared}>
      {content}
    </button>
  );
}

/** A label whose letters roll up on hover (.roll in globals.css). Screen readers get the plain text. */
export function RollText({ text }: { text: string }) {
  return (
    <span className="relative">
      <span className="sr-only">{text}</span>
      <span aria-hidden className="roll">
        {Array.from(text).map((char, i) => (
          <span key={i} data-c={char} style={{ '--i': i } as CSSProperties}>
            {char}
          </span>
        ))}
      </span>
    </span>
  );
}
