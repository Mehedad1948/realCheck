import { BadgeCheck, Check } from 'lucide-react';

/** A static rendering of the Mini App task screen, to show what evaluators see. */
export function TaskPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-sm select-none">
      <div className="absolute -inset-6 rounded-[44px] bg-gradient-to-b from-primary/25 to-transparent blur-2xl" />
      <div className="relative rounded-[36px] border border-border bg-background p-3 shadow-2xl">
        <div className="rounded-[28px] bg-background px-4 pt-5 pb-6 text-foreground">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-muted-foreground">3 of 10</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">+$0.15</span>
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i < 2 ? 'bg-primary' : i === 2 ? 'bg-primary/40' : 'bg-foreground/10'}`} />
            ))}
          </div>
          <p className="mt-5 text-[12px] text-muted-foreground">Shoe review sentiment</p>
          <p className="mt-1 text-[17px] leading-snug font-semibold">How does this customer feel?</p>
          <div className="mt-4 rounded-2xl border border-border bg-card px-4 py-4 text-[15px] leading-relaxed">
            “Best purchase this year. I already ordered a second pair.”
          </div>
          <div className="mt-3 space-y-2">
            {['Positive', 'Negative', 'Neutral'].map((option, i) => (
              <div
                key={option}
                className={`flex h-11 items-center gap-3 rounded-2xl border px-3 text-[15px] font-medium ${i === 0 ? 'border-primary/50 bg-primary/10 shadow-[0_0_24px_-8px] shadow-primary/40' : 'border-border bg-card'}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-foreground/5 font-mono text-muted-foreground'}`}>
                  {i === 0 ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                </span>
                {option}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-10 hidden rounded-2xl border border-border bg-card/90 px-4 py-3 shadow-xl backdrop-blur sm:block">
        <p className="text-[11px] text-muted-foreground">Consensus reached</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
          <BadgeCheck className="h-4 w-4 text-success" /> Positive · 100%
        </p>
      </div>
    </div>
  );
}
