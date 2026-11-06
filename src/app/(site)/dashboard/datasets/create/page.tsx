'use client';

import { FileText, Image as ImageIcon, Loader2, Minus, Plus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/site/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MAX_OPTIONS, MAX_REQUIRED_VOTES } from '@/lib/constants';
import { chargePerAnswerCents, dollarsToCents, formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { createDatasetAction } from '@/server/actions/datasets';

const textareaClass =
  'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30';

export default function CreateDatasetPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dataType, setDataType] = useState<'TEXT' | 'IMAGE'>('TEXT');
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [requiredVotes, setRequiredVotes] = useState(3);
  const [reward, setReward] = useState('0.05');

  const rewardCents = dollarsToCents(Number(reward) || 0);
  const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
  const perItemCents = chargePerAnswerCents(rewardCents) * requiredVotes;

  const setOption = (index: number, value: string) => setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    const result = await createDatasetAction({
      title,
      description,
      dataType,
      question,
      options: cleanOptions,
      requiredVotes,
      rewardCents,
    });
    if (result.ok) {
      toast.success('Dataset created. Now add your data.');
      router.push(`/dashboard/datasets/${result.data.datasetId}/upload`);
    } else {
      toast.error(result.error);
      setPending(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title="New dataset" description="Define one question that evaluators will answer for every item you upload." />

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <FormSection step={1} title="Basics" description="Visible to evaluators in the task list.">
            <div className="space-y-2">
              <Label htmlFor="title">Name</Label>
              <Input id="title" required minLength={3} maxLength={120} placeholder="e.g. Product review sentiment" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Instructions</Label>
              <textarea
                id="description"
                rows={3}
                maxLength={2000}
                className={textareaClass}
                placeholder="Explain how to decide. Clear rules give better labels."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </FormSection>

          <FormSection step={2} title="Question" description="What kind of items, and what should evaluators answer?">
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Item type">
              {(
                [
                  { value: 'TEXT', label: 'Text', hint: 'Reviews, messages, sentences', icon: FileText },
                  { value: 'IMAGE', label: 'Images', hint: 'Public image URLs', icon: ImageIcon },
                ] as const
              ).map((type) => (
                <button
                  key={type.value}
                  type="button"
                  role="radio"
                  aria-checked={dataType === type.value}
                  onClick={() => setDataType(type.value)}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                    dataType === type.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-accent',
                  )}
                >
                  <type.icon className={cn('mt-0.5 h-5 w-5', dataType === type.value ? 'text-primary' : 'text-muted-foreground')} />
                  <span>
                    <span className="block text-sm font-medium">{type.label}</span>
                    <span className="block text-[13px] text-muted-foreground">{type.hint}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                required
                minLength={3}
                maxLength={300}
                placeholder={dataType === 'TEXT' ? 'How does this customer feel?' : 'What color is the traffic light?'}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Answer options</Label>
              <div className="space-y-2">
                {options.map((option, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[12px] font-medium text-muted-foreground tabular-nums">
                      {i + 1}
                    </span>
                    <Input required maxLength={80} placeholder={`Option ${i + 1}`} value={option} onChange={(e) => setOption(i, e.target.value)} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setOptions((prev) => prev.filter((_, j) => j !== i))}
                      disabled={options.length <= 2}
                      aria-label={`Remove option ${i + 1}`}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
              {options.length < MAX_OPTIONS && (
                <Button type="button" variant="ghost" size="sm" className="text-primary" onClick={() => setOptions((prev) => [...prev, ''])}>
                  <Plus /> Add option
                </Button>
              )}
            </div>
          </FormSection>

          <FormSection step={3} title="Quality & pricing" description="More answers per item means higher confidence, at a higher cost.">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Answers per item</Label>
                <div className="flex h-9 w-36 items-center rounded-md border border-input">
                  <button
                    type="button"
                    onClick={() => setRequiredVotes((v) => Math.max(1, v - 1))}
                    disabled={requiredVotes <= 1}
                    className="flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                    aria-label="Fewer answers"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex-1 text-center text-sm font-medium tabular-nums">{requiredVotes}</span>
                  <button
                    type="button"
                    onClick={() => setRequiredVotes((v) => Math.min(MAX_REQUIRED_VOTES, v + 1))}
                    disabled={requiredVotes >= MAX_REQUIRED_VOTES}
                    className="flex h-full w-9 items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30"
                    aria-label="More answers"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-[13px] text-muted-foreground">3 is a good default for most tasks.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reward">Reward per answer</Label>
                <div className="relative w-36">
                  <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                  <Input id="reward" type="number" required min={0.01} max={100} step={0.01} className="pl-7 tabular-nums" value={reward} onChange={(e) => setReward(e.target.value)} />
                </div>
                <p className="text-[13px] text-muted-foreground">Higher pay attracts evaluators faster.</p>
              </div>
            </div>
          </FormSection>
        </div>

        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <p className="mb-3 text-[13px] font-medium text-muted-foreground">Evaluator preview</p>
          <PhonePreview title={title} question={question} description={description} options={cleanOptions} dataType={dataType} rewardCents={rewardCents} />

          <div className="mt-5 rounded-xl border border-border bg-card p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost per item, fee included</span>
              <span className="font-medium tabular-nums">{formatMoney(perItemCents)}</span>
            </div>
            <div className="mt-1.5 flex justify-between">
              <span className="text-muted-foreground">Per 1,000 items</span>
              <span className="font-medium tabular-nums">{formatMoney(perItemCents * 1000)}</span>
            </div>
            <Button type="submit" className="mt-4 h-10 w-full" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Create & upload data
            </Button>
            <p className="mt-2 text-center text-[12px] text-muted-foreground">Starts paused. Nothing is charged until you go live.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function FormSection({ step, title, description, children }: { step: number; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card">
      <div className="flex gap-3 border-b border-border px-5 py-4">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12px] font-semibold text-primary">{step}</span>
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-[13px] text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </section>
  );
}

function PhonePreview({
  title,
  question,
  description,
  options,
  dataType,
  rewardCents,
}: {
  title: string;
  question: string;
  description: string;
  options: string[];
  dataType: 'TEXT' | 'IMAGE';
  rewardCents: number;
}) {
  const shown = options.length > 0 ? options : ['Option 1', 'Option 2'];
  return (
    <div aria-hidden className="rounded-[32px] border border-border bg-[#f2f2f7] p-2.5 shadow-xl dark:bg-black">
      <div className="rounded-[24px] px-4 pt-4 pb-5 text-black dark:text-white">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-zinc-500">1 of 10</span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
            +{formatMoney(rewardCents)} each
          </span>
        </div>
        <div className="mt-2 flex gap-1">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className={cn('h-1 flex-1 rounded-full', i === 0 ? 'bg-[#2481cc]/40' : 'bg-black/10 dark:bg-white/15')} />
          ))}
        </div>
        <p className="mt-4 truncate text-[11px] text-zinc-500">{title || 'Dataset name'}</p>
        <p className={cn('mt-0.5 text-[15px] leading-snug font-semibold', !question && 'text-zinc-400')}>{question || 'Your question appears here'}</p>
        {description && <p className="mt-1 line-clamp-1 text-[12px] text-zinc-500">{description}</p>}
        <div className="mt-3 flex min-h-20 items-center justify-center rounded-2xl bg-white px-4 py-4 text-[13px] text-zinc-500 dark:bg-[#1c1c1e]">
          {dataType === 'IMAGE' ? <ImageIcon className="h-8 w-8 text-zinc-300 dark:text-zinc-600" /> : '“One of your uploaded texts”'}
        </div>
        <div className="mt-2.5 space-y-1.5">
          {shown.slice(0, 5).map((option, i) => (
            <div key={i} className="flex h-10 items-center gap-2.5 rounded-xl bg-white px-3 text-[13px] font-medium dark:bg-[#1c1c1e]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/5 text-[10px] text-zinc-500 dark:bg-white/10">{i + 1}</span>
              <span className="truncate">{option}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
