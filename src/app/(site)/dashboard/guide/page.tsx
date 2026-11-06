import { BadgeCheck, Coins, Download, FileUp, Lightbulb, ShieldCheck, Users } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PageHeader } from '@/components/site/page-header';
import { ACTIVATION_FUNDING_TASKS, MIN_REPUTATION, PLATFORM_FEE_BPS, UPLOAD_CHUNK_SIZE } from '@/lib/constants';

export const metadata: Metadata = { title: 'Guide' };

const toc = [
  { id: 'workflow', label: 'How it works' },
  { id: 'questions', label: 'Writing good questions' },
  { id: 'files', label: 'File formats' },
  { id: 'checks', label: 'Check questions' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'export', label: 'Exporting results' },
];

export default function GuidePage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Guide" description="Everything you need to get accurate labels from RealCheck." />

      <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
        <nav className="hidden lg:block">
          <ul className="sticky top-8 space-y-1 border-l border-border text-sm">
            {toc.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="-ml-px block border-l border-transparent py-1 pl-4 text-muted-foreground hover:border-foreground hover:text-foreground">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="max-w-3xl space-y-14">
          <Chapter id="workflow" title="How it works">
            <ol className="grid gap-4 sm:grid-cols-2">
              <Step icon={FileUp} title="1. Upload" text="Create a dataset with one question and its answer options, then upload a file of items." />
              <Step icon={Users} title="2. Evaluators answer" text="When you go live, items are served to evaluators in Telegram in small batches." />
              <Step icon={BadgeCheck} title="3. Consensus" text="Once an item has the required number of answers, the majority answer becomes its label." />
              <Step icon={Download} title="4. Export" text="Download labels, agreement scores and vote counts as CSV or JSON at any time." />
            </ol>
          </Chapter>

          <Chapter id="questions" title="Writing good questions">
            <p>Evaluators see your question, your instructions and one item at a time. Clear questions produce consistent labels.</p>
            <ul className="space-y-2">
              <Tip>Ask one thing per dataset. Split “sentiment and topic” into two datasets.</Tip>
              <Tip>Make options mutually exclusive, and add “Unsure” or “Other” if items can be ambiguous.</Tip>
              <Tip>Use the instructions for the edge cases: what counts as neutral, what to do with sarcasm.</Tip>
              <Tip>Keep options short. They are shown as large buttons on a phone.</Tip>
            </ul>
          </Chapter>

          <Chapter id="files" title="File formats">
            <p>
              Upload <strong>CSV</strong> with a header row, or <strong>JSON</strong> as an array of objects. You choose which column holds the item. For image
              datasets that column must contain public <code>https://</code> image URLs. Files are sent in chunks of {UPLOAD_CHUNK_SIZE} rows.
            </p>
            <Code>{`id,review,expected
101,"Fast delivery and works perfectly.",Positive
102,"Arrived broken, very disappointed.",
103,"It's fine.",`}</Code>
            <Code>{`[
  { "url": "https://example.com/cam-404.jpg" },
  { "url": "https://example.com/cam-505.jpg", "expected": "Green" }
]`}</Code>
            <p>
              <a href="/samples/reviews.csv" download className="font-medium text-primary hover:underline">
                Download a sample CSV
              </a>
            </p>
          </Chapter>

          <Chapter id="checks" title="Check questions">
            <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm">
                Check questions are items with a known answer. They look exactly like normal items to evaluators. New evaluators see more of them;
                proven ones see fewer. Each evaluator’s recent accuracy on them decides how much their answers count, and evaluators who
                fall below {MIN_REPUTATION}% stop receiving work. When answers on an item disagree, it gets extra answers up to your
                maximum, and items still split at that point are marked disputed. Add at least 20 check questions, or 5% of your items.
              </p>
            </div>
            <p>
              To add them, include a column with the expected answer (like <code>expected</code> above) and select it as the{' '}
              <em>check-answer column</em> when uploading. Rows with a value become check questions; empty rows are normal items. Aim for roughly 5–10% of
              items.
            </p>
          </Chapter>

          <Chapter id="pricing" title="Pricing">
            <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
              <Coins className="h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm">
                <strong>Cost per item = (reward per answer + {PLATFORM_FEE_BPS / 100}% platform fee) × answers per item.</strong> At $0.05 and 3
                answers, an item costs $0.18 and 1,000 items cost $180. Evaluators receive the full reward. If an evaluator is later caught answering
                carelessly, what you paid them for answers not yet released to them is refunded to your balance.
              </p>
            </div>
            <p>
              You are charged per answer as it arrives, never in advance. Going live requires enough balance for the next {ACTIVATION_FUNDING_TASKS} items. If
              your balance runs out, the dataset pauses automatically and resumes when you add funds and reactivate it.
            </p>
          </Chapter>

          <Chapter id="export" title="Exporting results">
            <p>Use <em>Export results</em> on a dataset page. Each row is one item:</p>
            <dl className="divide-y divide-border rounded-xl border border-border bg-card text-sm">
              {[
                ['consensus_label', 'The agreed answer, or empty if the item is disputed.'],
                ['agreement', 'Share of answers that matched the label, from 0 to 1.'],
                ['confidence', 'Probability the label is right, weighting each answer by the evaluator’s accuracy, from 0 to 1.'],
                ['votes_<option>', 'How many evaluators chose each option.'],
                ['status', 'COMPLETED once answers agree, DISPUTED if they still disagree at the maximum, ACTIVE until then.'],
              ].map(([term, text]) => (
                <div key={term} className="flex gap-4 px-4 py-3">
                  <dt className="w-36 shrink-0 font-mono text-[13px]">{term}</dt>
                  <dd className="text-muted-foreground">{text}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted-foreground">Tip: filter on a minimum agreement (for example 0.67) to keep only confident labels.</p>
          </Chapter>

          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold">Ready to start?</p>
              <p className="text-sm text-muted-foreground">Create a dataset and see your first labels within minutes.</p>
            </div>
            <Link href="/dashboard/datasets/create" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
              New dataset
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}

function Chapter({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8 space-y-4 leading-relaxed text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[13px] [&_code]:text-foreground [&_strong]:text-foreground">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Step({ icon: Icon, title, text }: { icon: typeof FileUp; title: string; text: string }) {
  return (
    <li className="rounded-xl border border-border bg-card p-5">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm">{text}</p>
    </li>
  );
}

function Tip({ children }: { children: ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-warning" />
      <span>{children}</span>
    </li>
  );
}

function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-xl border border-border bg-card p-4 font-mono text-[13px] leading-relaxed text-foreground">{children}</pre>;
}
