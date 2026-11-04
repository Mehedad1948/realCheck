'use client';

import { AlertCircle, ArrowRight, ChevronLeft, FileText, UploadCloud } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/site/page-header';
import { Progress } from '@/components/ui/progress';
import { MAX_TASK_CONTENT_LENGTH, UPLOAD_CHUNK_SIZE } from '@/lib/constants';
import type { TaskRowInput } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { uploadTasksAction } from '@/server/actions/datasets';

type ParsedRow = Record<string, unknown>;
type Dataset = { id: string; title: string; dataType: 'TEXT' | 'IMAGE'; options: string[] };

const NO_GOLD = '';

export function UploadForm({ dataset }: { dataset: Dataset }) {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [contentColumn, setContentColumn] = useState('');
  const [goldColumn, setGoldColumn] = useState(NO_GOLD);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploaded, setUploaded] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setRows([]);
    setHeaders([]);
    setError(null);
    setUploaded(null);
  };

  const accept = (data: ParsedRow[], fields: string[]) => {
    if (data.length === 0) return setError('The file has no rows.');
    setRows(data);
    setHeaders(fields);
    setContentColumn(fields[0] ?? '');
    setGoldColumn(NO_GOLD);
  };

  const handleFile = (uploadedFile: File) => {
    reset();
    setFile(uploadedFile);
    setIsParsing(true);

    if (uploadedFile.name.toLowerCase().endsWith('.json') || uploadedFile.type === 'application/json') {
      uploadedFile
        .text()
        .then((text) => {
          const json: unknown = JSON.parse(text);
          if (!Array.isArray(json) || !json.every((row) => row && typeof row === 'object')) {
            throw new Error('JSON must be an array of objects.');
          }
          accept(json as ParsedRow[], Object.keys(json[0] ?? {}));
        })
        .catch((err: Error) => setError(err instanceof SyntaxError ? 'Invalid JSON file.' : err.message))
        .finally(() => setIsParsing(false));
      return;
    }

    Papa.parse<ParsedRow>(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        accept(results.data, results.meta.fields ?? []);
        setIsParsing(false);
      },
      error: (err) => {
        setError(`Could not read CSV: ${err.message}`);
        setIsParsing(false);
      },
    });
  };

  const buildRows = (): { rows: TaskRowInput[]; skipped: number } => {
    let skipped = 0;
    const result: TaskRowInput[] = [];
    for (const row of rows) {
      const content = String(row[contentColumn] ?? '').trim();
      if (!content || content.length > MAX_TASK_CONTENT_LENGTH) {
        skipped++;
        continue;
      }
      const gold = goldColumn ? String(row[goldColumn] ?? '').trim() : '';
      result.push(gold ? { content, correctAnswer: gold } : { content });
    }
    return { rows: result, skipped };
  };

  const handleUpload = async () => {
    const { rows: prepared, skipped } = buildRows();
    if (prepared.length === 0) return setError('No rows with content in the selected column.');

    const badGold = prepared.find((row) => row.correctAnswer && !dataset.options.includes(row.correctAnswer));
    if (badGold) {
      return setError(`"${badGold.correctAnswer}" in the check-answer column isn't one of: ${dataset.options.join(', ')}.`);
    }

    setError(null);
    setUploaded(0);
    // Sent in chunks so each request stays small and progress is visible.
    for (let start = 0; start < prepared.length; start += UPLOAD_CHUNK_SIZE) {
      const chunk = prepared.slice(start, start + UPLOAD_CHUNK_SIZE);
      const result = await uploadTasksAction({ datasetId: dataset.id, rows: chunk });
      if (!result.ok) {
        setError(start > 0 ? `${result.error} (the first ${start} rows were saved)` : result.error);
        setUploaded(null);
        return;
      }
      setUploaded(start + chunk.length);
    }

    toast.success(`Uploaded ${prepared.length} tasks${skipped ? `, skipped ${skipped} empty or too-long rows` : ''}`);
    router.push(`/dashboard/datasets/${dataset.id}`);
  };

  const isUploading = uploaded !== null;
  const goldCount = goldColumn ? rows.filter((row) => String(row[goldColumn] ?? '').trim()).length : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <PageHeader
        eyebrow={
          <Link href={`/dashboard/datasets/${dataset.id}`} className="inline-flex items-center gap-1 hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> {dataset.title}
          </Link>
        }
        title="Upload data"
        description={
          <>
            Import items from a CSV or JSON file.{dataset.dataType === 'IMAGE' ? ' The content column must contain image URLs.' : ''}{' '}
            <a href="/samples/reviews.csv" download className="text-primary underline-offset-4 hover:underline">
              Download a sample
            </a>
          </>
        }
      />

      {!file && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) handleFile(dropped);
          }}
          className={cn(
            'flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed transition-all',
            isDragOver ? 'scale-[1.01] border-primary bg-primary/5' : 'border-border bg-card',
          )}
        >
          <div className="mb-4 rounded-2xl border border-border bg-background p-4 text-primary shadow-sm">
            <UploadCloud className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold">Drag & drop your file here</h3>
          <p className="mt-1 text-sm text-muted-foreground">CSV or JSON (an array of objects)</p>
          <label className="mt-6 cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
            Browse files
            <input
              type="file"
              className="hidden"
              accept=".csv,.json,text/csv,application/json"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </div>
      )}

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
          {!isUploading && (
            <button onClick={reset} className="ml-auto text-sm underline">
              Choose another file
            </button>
          )}
        </div>
      )}

      {file && !isParsing && rows.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{rows.length.toLocaleString('en-US')} rows found</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-medium text-muted-foreground">Content column</span>
                <select
                  value={contentColumn}
                  onChange={(e) => setContentColumn(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-muted-foreground">Check-answer column (optional)</span>
                <select
                  value={goldColumn}
                  onChange={(e) => setGoldColumn(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value={NO_GOLD}>None</option>
                  {headers
                    .filter((h) => h !== contentColumn)
                    .map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                </select>
                <span className="block text-xs text-muted-foreground">
                  Rows with a value here become check questions with a known answer ({dataset.options.join(' / ')}), used to
                  score evaluators. {goldColumn && `${goldCount} rows.`}
                </span>
              </label>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/50 px-6 py-3">
              <h3 className="text-sm font-semibold">Preview (first 5 rows)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr>
                    {headers.slice(0, 5).map((h) => (
                      <th key={h} className={cn('px-6 py-3 font-medium', (h === contentColumn || h === goldColumn) && 'bg-primary/5 text-primary')}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {headers.slice(0, 5).map((h) => (
                        <td key={h} className="max-w-[200px] truncate px-6 py-3 text-muted-foreground">
                          {String(row[h] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {isUploading && (
            <div className="space-y-2">
              <Progress value={(uploaded / rows.length) * 100} className="h-2" />
              <p className="text-xs text-muted-foreground">Uploaded {uploaded.toLocaleString('en-US')} rows…</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={reset}
              disabled={isUploading}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading || !contentColumn}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:brightness-110 disabled:opacity-50"
            >
              {isUploading ? 'Uploading…' : <>Upload {rows.length.toLocaleString('en-US')} rows <ArrowRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
