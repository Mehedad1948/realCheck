import { BadgeCheck, Coins, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from './logo';

const points = [
  { icon: BadgeCheck, text: 'Every label confirmed by several independent evaluators' },
  { icon: ShieldCheck, text: 'Hidden check questions keep accuracy high' },
  { icon: Coins, text: 'Pay only for answers you receive' },
];

export function AuthShell({ title, description, children, footer }: { title: string; description: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-border bg-card lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div aria-hidden className="absolute -top-40 -left-40 h-[480px] w-[480px] rounded-full bg-primary/25 blur-[120px]" />
        <Logo className="relative" />
        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight">Labels you can ship to production.</h2>
          <ul className="mt-8 space-y-4">
            {points.map((point) => (
              <li key={point.text} className="flex items-start gap-3 text-muted-foreground">
                <point.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                {point.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-muted-foreground">© RealCheck</p>
      </aside>

      <main className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>
        </div>
      </main>
    </div>
  );
}
