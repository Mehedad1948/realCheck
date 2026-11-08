import { Send } from 'lucide-react';
import { Fragment } from 'react';
import { Cta } from '@/components/site/cta';
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
        <div aria-hidden className="absolute inset-x-0 top-1/4 -z-10 mx-auto h-2/3 max-w-md rounded-full bg-primary/20 blur-[90px]" />
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
          {telegramUrl && (
            <Cta href={telegramUrl} tone="telegram" badge={<Send />} icon={null}>
              Open in Telegram
            </Cta>
          )}
          <Cta href="/earn" tone="outline">
            Label on the web
          </Cta>
        </div>
      </div>
    </div>
  );
}
