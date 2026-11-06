import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { MAX_OPTIONS } from '@/lib/constants';
import { ConsensusBoard } from './consensus-board';
import { CostEstimator } from './cost-estimator';
import { SectionHeading } from './section-heading';

const features = [
  { title: 'Upload', text: `CSV or JSON. One question, up to ${MAX_OPTIONS} options.` },
  { title: 'Built-in checks', text: 'Hidden test questions filter out careless answers.' },
  { title: 'Export', text: 'Labels with agreement scores and vote counts.' },
];

/** The landing section for dataset owners: what they get, how it stays accurate, and what it costs. */
export function ForTeams() {
  return (
    <div className="flex flex-col gap-16 md:gap-20">
      <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        <div>
          <SectionHeading index="01" eyebrow="For teams with data" title="Ask once." muted="Get labels you can defend.">
            Several people answer each item. Only the labels they agree on are kept.
          </SectionHeading>

          <ol className="mt-10 border-t border-border">
            {features.map((feature, i) => (
              <li key={feature.title} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-baseline border-b border-border py-4">
                <span className="font-mono text-sm text-foreground/60">0{i + 1}</span>
                <p className="text-base text-foreground/75">
                  <span className="font-medium text-foreground">{feature.title}.</span> {feature.text}
                </p>
              </li>
            ))}
          </ol>

          <Link
            href="/register"
            className="group mt-10 inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-7 font-medium text-background transition-opacity hover:opacity-90"
          >
            Start a dataset
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <ConsensusBoard />
      </div>

      <CostEstimator />
    </div>
  );
}
