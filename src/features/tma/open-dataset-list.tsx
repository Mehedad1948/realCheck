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
          <Inbox className="h-9 w-9 text-muted-foreground/60" strokeWidth={1.25} />
          <p className="mt-3 text-[17px] font-[450]">No tasks right now</p>
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
            <IconTile>{dataset.dataType === 'IMAGE' ? <ImageIcon /> : <FileText />}</IconTile>
          }
          title={dataset.title}
          subtitle={`${dataset.openTasks.toLocaleString('en-US')} tasks${dataset.description ? ` · ${dataset.description}` : ''}`}
          trailing={
            <span className="rounded-full px-2.5 py-1 text-[13px] font-medium text-emerald-600 tabular-nums ring-1 ring-emerald-500/25 ring-inset dark:text-emerald-300">
              +{formatMoney(dataset.rewardCents)}
            </span>
          }
        />
      ))}
    </Section>
  );
}
