import { ArrowRight, Send } from 'lucide-react';
import Link from 'next/link';
import { Fragment } from 'react';
import { TaskPreview } from '@/components/site/task-preview';
import { MIN_WITHDRAWAL_CENTS } from '@/lib/constants';
import { formatMoney } from '@/lib/money';
import { SectionHeading } from './section-heading';

const journey = ['Sign in with Telegram', 'Answer', `Cash out from ${formatMoney(MIN_WITHDRAWAL_CENTS)}`];

/** The landing section for people who earn by answering, on the web or in the Telegram Mini App. */
export function ForEvaluators({ telegramUrl }: { telegramUrl: string | null }) {
  return (
    <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-20">
      {/* The phone leads on large screens, so the two audience sections mirror each other. */}
      <div className="relative order-last px-6 pb-8 lg:order-first">
        <div aria-hidden className="absolute inset-x-0 top-1/4 -z-10 mx-auto h-2/3 max-w-md rounded-full bg-telegram/20 blur-[90px]" />
        <TaskPreview />
      </div>

      <div>
        <SectionHeading index="02" eyebrow="For evaluators" title="Spare minutes," muted="paid in USDT.">
          Quick questions on the web or in Telegram. Paid for every accepted answer.
        </SectionHeading>

        <ol className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2 text-base text-foreground/80">
          {journey.map((step, i) => (
            <Fragment key={step}>
              {i > 0 && <li aria-hidden className="hidden h-px w-6 bg-foreground/25 sm:block" />}
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-telegram/15 font-mono text-xs font-medium text-telegram dark:text-sky-300">
                  {i + 1}
                </span>
                {step}
              </li>
            </Fragment>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link
            href="/earn"
            className="group inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 font-medium text-background transition-opacity hover:opacity-90"
          >
            Label on the web
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          {telegramUrl && (
            <a
              href={telegramUrl}
              className="group inline-flex h-12 items-center gap-2.5 rounded-full bg-telegram px-6 font-medium text-white shadow-lg shadow-telegram/25 transition-[filter] hover:brightness-110"
            >
              <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              Open in Telegram
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
