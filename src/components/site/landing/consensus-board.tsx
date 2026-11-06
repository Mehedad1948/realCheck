import { Download } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Reveal } from './reveal';

type Option = 'Positive' | 'Negative' | 'Neutral';

const OPTION_STYLE: Record<Option, string> = {
  Positive: 'bg-success/15 text-success',
  Negative: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  Neutral: 'bg-foreground/10 text-foreground/70',
};
const OPTION_DOT: Record<Option, string> = { Positive: 'bg-success', Negative: 'bg-rose-500', Neutral: 'bg-foreground/40' };

// Shaped like a real export: unanimous items, a 2-to-1 split that still resolves, and one that never does.
const rows: { text: string; votes: Option[]; label: Option | null; agreement: number }[] = [
  { text: 'Fast delivery and works perfectly.', votes: ['Positive', 'Positive', 'Positive'], label: 'Positive', agreement: 100 },
  { text: 'Arrived broken, very disappointed.', votes: ['Negative', 'Negative', 'Negative'], label: 'Negative', agreement: 100 },
  { text: 'It’s fine, I guess.', votes: ['Neutral', 'Positive', 'Neutral'], label: 'Neutral', agreement: 67 },
  { text: 'Love the color, hate the fit.', votes: ['Positive', 'Negative', 'Neutral', 'Negative', 'Positive'], label: null, agreement: 40 },
];

/** A dataset filling in: votes land one by one, then each row settles on a label or is marked disputed. */
export function ConsensusBoard() {
  let beat = 0;
  return (
    <Reveal className="relative">
      <div aria-hidden className="absolute -inset-8 -z-10 rounded-[48px] bg-primary/15 blur-3xl" />
      <figure className="overflow-hidden rounded-3xl border border-border bg-background/90 shadow-2xl shadow-black/10 backdrop-blur">
        <figcaption className="flex items-center justify-between border-b border-border px-5 py-3.5 text-sm">
          <span className="flex items-center gap-2 font-mono text-foreground/75">
            <span className="h-2 w-2 rounded-full bg-border" />
            reviews.csv
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 font-medium text-success">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Live
          </span>
        </figcaption>

        <div className="px-5 pt-4 pb-1">
          <p className="text-lg font-medium">How does this customer feel?</p>
        </div>

        <ul className="divide-y divide-border">
          {rows.map((row) => {
            const voteBeats = row.votes.map(() => beat++);
            const settle = beat++;
            return (
              <li key={row.text} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2.5 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_7.5rem]">
                <p className="col-span-2 truncate text-base sm:col-span-1">“{row.text}”</p>
                <span className="flex gap-1">
                  {row.votes.map((vote, i) => (
                    <span
                      key={i}
                      title={vote}
                      style={{ '--beat': voteBeats[i] } as CSSProperties}
                      className={`reveal-pop flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${OPTION_STYLE[vote]}`}
                    >
                      {vote[0]}
                    </span>
                  ))}
                </span>
                <span style={{ '--beat': settle } as CSSProperties} className="reveal-settle flex items-center justify-end gap-2 text-right text-sm">
                  {row.label ? (
                    <>
                      <span className="font-medium">{row.label}</span>
                      <span className="font-mono text-foreground/70 tabular-nums">{row.agreement}%</span>
                    </>
                  ) : (
                    <span className="rounded-full bg-warning/15 px-2 py-0.5 font-medium text-warning">Disputed</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center justify-between gap-4 border-t border-border bg-muted/40 px-5 py-3 text-sm text-foreground/75">
          <span className="flex gap-3">
            {(['Positive', 'Negative', 'Neutral'] as const).map((option) => (
              <span key={option} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${OPTION_DOT[option]}`} />
                <span className="hidden sm:inline">{option}</span>
                <span className="sm:hidden">{option[0]}</span>
              </span>
            ))}
          </span>
          <span className="flex items-center gap-1.5 font-mono text-foreground">
            <Download className="h-3.5 w-3.5" /> export.csv
          </span>
        </div>
      </figure>
    </Reveal>
  );
}
