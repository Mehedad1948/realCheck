import { Check } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type Step = { title: string; description: string; done: boolean; href: string; cta: string };

export function GettingStarted({ steps, title = 'Get your first labels' }: { steps: Step[]; title?: string }) {
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const current = steps.findIndex((s) => !s.done);

  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-[13px] text-muted-foreground">
            {doneCount} of {steps.length} done
          </p>
        </div>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </div>
      </div>
      <ol className="divide-y divide-border">
        {steps.map((step, i) => (
          <li key={step.title} className="flex items-center gap-4 px-5 py-4">
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-medium',
                step.done
                  ? 'border-success bg-success text-white'
                  : i === current
                    ? 'border-primary text-primary'
                    : 'border-border text-muted-foreground',
              )}
            >
              {step.done ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', step.done && 'text-muted-foreground')}>{step.title}</p>
              <p className="text-[13px] text-muted-foreground">{step.description}</p>
            </div>
            {i === current && (
              <Link
                href={step.href}
                className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-[13px] font-medium text-primary-foreground hover:brightness-110"
              >
                {step.cta}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
