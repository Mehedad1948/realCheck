'use client';

import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Plain links to the streaming export route: the browser handles the download,
// authenticated by the session cookie, with no data passing through React.
export function ExportResultsButton({ datasetId, disabled }: { datasetId: string; disabled?: boolean }) {
  const href = (format: 'csv' | 'json') => `/api/datasets/${datasetId}/export?format=${format}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={disabled} title={disabled ? 'No answers yet' : undefined}>
          <Download className="h-4 w-4" />
          Export results
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer gap-2">
          <a href={href('csv')} download>
            <FileSpreadsheet className="h-4 w-4 text-green-600 dark:text-green-500" />
            CSV (spreadsheet)
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer gap-2">
          <a href={href('json')} download>
            <FileJson className="h-4 w-4 text-orange-600 dark:text-orange-500" />
            JSON
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
