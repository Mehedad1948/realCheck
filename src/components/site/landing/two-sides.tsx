import { ArrowDown, FileSpreadsheet, Send } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { SectionHeading } from './section-heading';

// Lane colors follow the item through the system: it leaves the team as a question (indigo), comes back
// from Telegram as an answer (Telegram blue), and returns to the team as an agreed label (green).
const QUESTION = 'var(--primary)';
const ANSWER = 'var(--telegram)';
const LABEL = 'var(--success)';

/**
 * The landing overview: teams on one side, Telegram evaluators on the other, consensus in the middle.
 * Each card links down to the section written for that audience.
 */
export function TwoSides() {
  return (
    <div className="flex flex-col gap-14 md:gap-16">
      <SectionHeading eyebrow="How it works" title="Two sides of every label." muted="One check in the middle.">
        Teams ask. Telegram users answer. Only agreed answers are kept.
      </SectionHeading>

      <div className="grid items-stretch gap-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)_minmax(0,1fr)]">
        <SideCard
          href="#teams"
          icon={<FileSpreadsheet />}
          eyebrow="For teams"
          title="You have data to label."
          text="Pay only for answers you receive."
          cta="For teams"
          tone={QUESTION}
        />

        <div className="flex flex-col items-center gap-0 py-2 md:flex-row md:py-0">
          <LanePair
            top={{ label: 'Items', tone: QUESTION }}
            bottom={{ label: 'Verified labels', tone: LABEL, reverse: true }}
          />
          <ConsensusCore />
          <LanePair top={{ label: 'Tasks', tone: QUESTION }} bottom={{ label: 'Answers', tone: ANSWER, reverse: true }} />
        </div>

        <SideCard
          href="#earn"
          icon={<Send />}
          eyebrow="For Telegram users"
          title="You have spare minutes."
          text="Answer in Telegram, earn USDT."
          cta="Start earning"
          tone={ANSWER}
        />
      </div>
    </div>
  );
}

function SideCard({
  href,
  icon,
  eyebrow,
  title,
  text,
  cta,
  tone,
}: {
  href: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  text: string;
  cta: string;
  tone: string;
}) {
  return (
    <a
      href={href}
      style={{ '--tone': tone } as CSSProperties}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-background/80 p-7 transition-[border-color,transform] duration-500 hover:-translate-y-0.5 hover:border-[color-mix(in_oklab,var(--tone)_45%,var(--border))]"
    >
      {/* A wash of the side's color that rises on hover. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -bottom-24 h-56 w-56 rounded-full bg-[var(--tone)] opacity-[0.07] blur-3xl transition-opacity duration-500 group-hover:opacity-20"
      />
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-[var(--tone)] [&_svg]:h-[18px] [&_svg]:w-[18px] [&_svg]:stroke-[1.75]">
        {icon}
      </span>
      <p className="mt-8 text-sm font-medium text-foreground/70">{eyebrow}</p>
      <h3 className="mt-2 text-2xl leading-tight font-medium tracking-tight">{title}</h3>
      <p className="mt-2 text-lg text-foreground/80">{text}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 pt-8 text-sm font-medium">
        {cta}
        <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
      </span>
    </a>
  );
}

type LaneProps = { label: string; tone: string; reverse?: boolean };

/** Two lanes between a card and the core: one carrying work toward the core, one carrying results back. */
function LanePair({ top, bottom }: { top: LaneProps; bottom: LaneProps }) {
  return (
    <div className="flex h-28 w-full justify-center gap-14 md:h-auto md:flex-1 md:flex-col md:gap-7 md:px-3">
      <Lane {...top} labelFirst />
      <Lane {...bottom} />
    </div>
  );
}

/** A hairline with dots travelling along it: down on phones, sideways from md up. */
function Lane({ label, tone, reverse, labelFirst }: LaneProps & { labelFirst?: boolean }) {
  return (
    <div className={`flex items-center gap-3 md:items-stretch md:gap-2 ${labelFirst ? 'md:flex-col-reverse' : 'md:flex-col'}`}>
      <div className="flow-lane h-full w-px md:h-px md:w-full" data-reverse={reverse ? '' : undefined} style={{ '--tone': tone } as CSSProperties}>
        {[0, 1, 2].map((i) => (
          <i key={i} style={{ '--i': i } as CSSProperties} />
        ))}
      </div>
      <span className="font-mono text-xs whitespace-nowrap text-foreground/75 md:text-center">{label}</span>
    </div>
  );
}

/** The check mark from the intro, breathing in the middle where answers become labels. */
function ConsensusCore() {
  return (
    <div className="flex shrink-0 flex-col items-center gap-3 py-2">
      <div className="consensus-core relative grid h-24 w-24 place-items-center rounded-full border border-border bg-background/70">
        <svg viewBox="0 0 64 64" className="h-12 w-12" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <defs>
            <linearGradient id="rc-core-stroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#a5b4fc" />
              <stop offset="1" stopColor="#4f46e5" />
            </linearGradient>
          </defs>
          <circle cx="32" cy="32" r="29" stroke="url(#rc-core-stroke)" strokeWidth="1.5" />
          <path d="M20.5 33l7.5 7.5L44 24.5" stroke="url(#rc-core-stroke)" strokeWidth="3" />
        </svg>
      </div>
      <p className="text-sm font-medium">Consensus</p>
    </div>
  );
}
