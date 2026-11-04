'use client';

import { FileText, Image as ImageIcon, Inbox } from 'lucide-react';
import type { OpenDataset } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import { useOpenDatasets } from './queries';
import { IconTile, Row, Section } from './ui';

/**
 * Server-rendered from the shared cache, then kept fresh by React Query
 * against `/api/public/datasets` (e.g. when the user returns to the app).
 */
export function OpenDatasetList({ initialData }: { initialData: OpenDataset[] }) {
  const { data = initialData } = useOpenDatasets(initialData);

  if (data.length === 0) {
    return (
      <Section title="Available tasks">
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/60" strokeWidth={1.5} />
          <p className="mt-3 font-semibold">No tasks right now</p>
          <p className="mt-1 text-sm text-muted-foreground">New datasets arrive regularly. Check back soon.</p>
        </div>
      </Section>
    );
  }

  const totalOpen = data.reduce((sum, dataset) => sum + dataset.openTasks, 0);

  return (
    <Section
      title="Available tasks"
      action={<span className="text-[13px] text-muted-foreground tabular-nums">{totalOpen.toLocaleString('en-US')} open</span>}
      footer="Pay is per accepted answer and is added to your balance instantly."
    >
      {data.map((dataset) => (
        <Row
          key={dataset.id}
          href={`/app/tasks/${dataset.id}`}
          icon={
            <IconTile className={dataset.dataType === 'IMAGE' ? 'bg-violet-500' : 'bg-sky-500'}>
              {dataset.dataType === 'IMAGE' ? <ImageIcon /> : <FileText />}
            </IconTile>
          }
          title={dataset.title}
          subtitle={`${dataset.openTasks.toLocaleString('en-US')} tasks${dataset.description ? ` · ${dataset.description}` : ''}`}
          trailing={
            <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[13px] font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
              +{formatMoney(dataset.rewardCents)}
            </span>
          }
        />
      ))}
    </Section>
  );
}
