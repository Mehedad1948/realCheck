'use client';

import { useId, useState } from 'react';
import ElasticSlider from '@/components/ui/elastic-slider';
import { PLATFORM_FEE_BPS } from '@/lib/constants';
import { chargePerAnswerCents, formatMoney } from '@/lib/money';

const ITEM_STEPS = [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000];

/** Live price for a dataset, from the same formula billing uses. */
export function CostEstimator() {
  const [itemStep, setItemStep] = useState(3);
  const [answers, setAnswers] = useState(3);
  const [rewardCents, setRewardCents] = useState(5);

  const items = ITEM_STEPS[itemStep];
  const perItem = chargePerAnswerCents(rewardCents) * answers;
  const total = perItem * items;
  const toEvaluators = rewardCents * answers * items;

  return (
    <div className="grid overflow-hidden rounded-3xl border border-border bg-background/80 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-7 p-7 md:p-9">
        <div>
          <p className="text-2xl font-medium tracking-tight">Estimate your cost</p>
        </div>
        <Slider label="Items" value={items.toLocaleString('en-US')} min={0} max={ITEM_STEPS.length - 1} step={1} current={itemStep} onChange={setItemStep} />
        <Slider label="Answers per item" value={String(answers)} min={3} max={9} step={1} current={answers} onChange={setAnswers} />
        <Slider label="Reward per answer" value={formatMoney(rewardCents)} min={1} max={25} step={1} current={rewardCents} onChange={setRewardCents} />
      </div>

      <div className="relative flex flex-col justify-between gap-8 border-t border-border bg-muted/40 p-7 md:border-t-0 md:border-l md:p-9">
        <div>
          <p className="text-base text-foreground/75">Total</p>
          <p className="mt-2 font-display text-[clamp(2.75rem,6vw,4rem)] leading-none font-light tracking-[-0.04em] tabular-nums" aria-live="polite">
            {formatMoney(total)}
          </p>
          <p className="mt-3 text-base text-foreground/75">
            <span className="text-foreground tabular-nums">{formatMoney(perItem)}</span> per item
          </p>
        </div>
        <dl className="space-y-2 text-base">
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/75">To evaluators</dt>
            <dd className="tabular-nums">{formatMoney(toEvaluators)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-foreground/75">Platform fee ({PLATFORM_FEE_BPS / 100}%)</dt>
            <dd className="tabular-nums">{formatMoney(total - toEvaluators)}</dd>
          </div>
          <p className="border-t border-border pt-3 text-sm text-foreground/70">Charged per answer, never upfront.</p>
        </dl>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span id={id} className="text-base text-foreground/80">
          {label}
        </span>
        <span className="font-mono text-base font-medium tabular-nums">{value}</span>
      </div>
      <ElasticSlider
        value={current}
        startingValue={min}
        maxValue={max}
        isStepped
        stepSize={step}
        onChange={onChange}
        formatValue={() => value}
        valuePosition="none"
        thumb
        thickness={4}
        activeThickness={8}
        maxStretch={30}
        restOpacity={0.85}
        trackColor="var(--border)"
        rangeColor="var(--primary)"
        ariaLabel={label}
        className="mt-2"
      />
    </div>
  );
}
