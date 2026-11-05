import { BadgeCheck } from 'lucide-react';

/** A static rendering of the Mini App task screen, to show what evaluators see. */
export function TaskPreview() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-sm select-none">
      <div className="absolute -inset-6 rounded-[44px] bg-gradient-to-b from-primary/25 to-transparent blur-2xl" />
      <div className="relative rounded-[36px] border border-border bg-[#f2f2f7] p-3 shadow-2xl dark:bg-black">
        <div className="rounded-[28px] bg-[#f2f2f7] px-4 pt-5 pb-6 text-black dark:bg-black dark:text-white">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-zinc-500">3 of 10</span>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">+$0.15</span>
          </div>
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={`h-1 flex-1 rounded-full ${i < 2 ? 'bg-[#2481cc]' : i === 2 ? 'bg-[#2481cc]/40' : 'bg-black/10 dark:bg-white/15'}`} />
            ))}
          </div>
          <p className="mt-5 text-[12px] text-zinc-500">Shoe review sentiment</p>
          <p className="mt-1 text-[17px] leading-snug font-semibold">How does this customer feel?</p>
          <div className="mt-4 rounded-2xl bg-white px-4 py-4 text-[15px] leading-relaxed dark:bg-[#1c1c1e]">
            “Best purchase this year. I already ordered a second pair.”
          </div>
          <div className="mt-3 space-y-2">
            {['Positive', 'Negative', 'Neutral'].map((option, i) => (
              <div
                key={option}
                className={`flex h-11 items-center gap-3 rounded-2xl px-3 text-[15px] font-medium ${i === 0 ? 'bg-[#2481cc] text-white' : 'bg-white dark:bg-[#1c1c1e]'}`}
              >
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${i === 0 ? 'bg-white/20' : 'bg-black/5 text-zinc-500 dark:bg-white/10'}`}>
                  {i === 0 ? '✓' : i + 1}
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
