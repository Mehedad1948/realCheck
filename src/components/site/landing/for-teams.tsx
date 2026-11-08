import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { ConsensusBoard } from './consensus-board';
import { CostEstimator } from './cost-estimator';
import { SectionHeading } from './section-heading';

/** The landing section for dataset owners: what they get back, and what it costs. */
export function ForTeams() {
  return (
    <div className="flex flex-col gap-16 md:gap-20">
      <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16">
        <div>
          <SectionHeading index="01" eyebrow="For teams" title="Labels you can defend." muted="Priced per answer.">
            Upload a CSV. Get back only what people agree on.
          </SectionHeading>

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
