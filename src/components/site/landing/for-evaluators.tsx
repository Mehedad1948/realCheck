import { Send } from 'lucide-react';
import type { CSSProperties } from 'react';
import { TaskPreview } from '@/components/site/task-preview';
import { MIN_REPUTATION, MIN_WITHDRAWAL_CENTS, TRUSTED_TRUST, TRUST_PRIOR_CORRECT, TRUST_PRIOR_WRONG } from '@/lib/constants';
import { formatMoney } from '@/lib/money';
import { Reveal } from './reveal';
import { SectionHeading } from './section-heading';

const START_REPUTATION = Math.round((TRUST_PRIOR_CORRECT / (TRUST_PRIOR_CORRECT + TRUST_PRIOR_WRONG)) * 100);
const TRUSTED_REPUTATION = Math.round(TRUSTED_TRUST * 100);
/** Where the meter's needle comes to rest: comfortably inside the trusted zone. */
const SHOWN_REPUTATION = 94;

const journey = [
  { title: 'Open the bot', text: 'No sign-up. Just Telegram.' },
  { title: 'Answer carefully', text: 'Accurate answers raise your reputation.' },
  { title: 'Cash out', text: `USDT to your TON wallet, from ${formatMoney(MIN_WITHDRAWAL_CENTS)}.` },
];

/** The landing section for people who earn by answering in the Telegram Mini App. */
export function ForEvaluators({ telegramUrl }: { telegramUrl: string | null }) {
  return (
    <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
      {/* The phone leads on large screens, so the two audience sections mirror each other. */}
      <div className="relative order-last px-6 pb-8 lg:order-first">
        <div aria-hidden className="absolute inset-x-0 top-1/4 -z-10 mx-auto h-2/3 max-w-md rounded-full bg-telegram/20 blur-[90px]" />
        <TaskPreview />
      </div>

      <div>
        <SectionHeading index="02" eyebrow="For Telegram users" title="Spare minutes," muted="paid in USDT.">
          Answer quick questions in Telegram. Get paid for every accepted answer.
        </SectionHeading>

        <ol className="mt-10 grid gap-3 sm:grid-cols-3">
          {journey.map((step, i) => (
            <li key={step.title} className="rounded-2xl border border-border bg-background/60 p-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-telegram/15 font-mono text-xs font-medium text-telegram dark:text-sky-300">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-medium">{step.title}</h3>
              <p className="mt-1 text-base text-foreground/75">{step.text}</p>
            </li>
          ))}
        </ol>

        <ReputationMeter />

        {telegramUrl && (
          <a
            href={telegramUrl}
            className="group mt-10 inline-flex h-12 items-center gap-2.5 rounded-full bg-telegram px-7 font-medium text-white shadow-lg shadow-telegram/25 transition-[filter] hover:brightness-110"
          >
            <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            Open in Telegram
          </a>
        )}
      </div>
    </div>
  );
}

const zones = [
  { label: 'Paused', width: MIN_REPUTATION, className: 'bg-foreground/15' },
  { label: 'Active', width: TRUSTED_REPUTATION - MIN_REPUTATION, className: 'bg-telegram/60' },
  { label: 'Trusted', width: 100 - TRUSTED_REPUTATION, className: 'bg-success' },
];

/** Reputation as a track with its real thresholds; the needle climbs from the starting score into the trusted zone. */
function ReputationMeter() {
  return (
    <Reveal
      className="mt-6 rounded-2xl border border-border bg-background/60 p-6"
      style={{ '--rep-from': `${START_REPUTATION}%`, '--rep-to': `${SHOWN_REPUTATION}%` } as CSSProperties}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-lg font-medium">Accuracy is your rank.</p>
        <p className="relative font-display text-4xl leading-none font-light tracking-tight tabular-nums">
          <span className="rep-from">{START_REPUTATION}</span>
          <span aria-hidden className="rep-to absolute inset-0 text-success">
            {SHOWN_REPUTATION}
          </span>
        </p>
      </div>

      <div className="relative mt-6">
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
          {zones.map((zone) => (
            <span key={zone.label} className={zone.className} style={{ width: `${zone.width}%` }} />
          ))}
        </div>
        <span aria-hidden className="rep-needle absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background bg-foreground shadow-md" />
      </div>

      <div className="mt-3 flex text-sm text-foreground/75">
        {zones.map((zone) => (
          <span key={zone.label} className="truncate last:text-right last:text-success" style={{ width: `${zone.width}%` }}>
            {zone.label}
          </span>
        ))}
      </div>
    </Reveal>
  );
}
