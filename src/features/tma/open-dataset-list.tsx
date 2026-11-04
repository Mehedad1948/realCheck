'use client';

import { FileText, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { OpenDataset } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import { useOpenDatasets } from './queries';

/**
 * Server-rendered from the shared cache, then kept fresh by React Query
 * against `/api/public/datasets` (e.g. when the user returns to the app).
 */
export function OpenDatasetList({ initialData }: { initialData: OpenDataset[] }) {
  const { data = initialData } = useOpenDatasets(initialData);

  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        No open tasks right now. Check back soon!
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((dataset) => (
        <li key={dataset.id}>
          <Link href={`/app/tasks/${dataset.id}`} className="block transition-transform active:scale-[0.98]">
            <Card className="border-border/60 hover:bg-accent/40">
              <CardContent className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {dataset.dataType === 'IMAGE' ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate font-semibold">{dataset.title}</h4>
                  {dataset.description && (
                    <p className="line-clamp-1 text-xs text-muted-foreground">{dataset.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs font-bold text-primary">+{formatMoney(dataset.rewardCents)}</span>
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                    {dataset.openTasks} open
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
