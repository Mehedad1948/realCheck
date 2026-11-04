import Link from 'next/link';

export default function MiniAppNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-xl font-semibold">This dataset isn’t available</h1>
      <p className="text-sm text-muted-foreground">It may have been finished or removed.</p>
      <Link href="/app" className="text-sm font-medium text-primary">
        Back to all tasks
      </Link>
    </div>
  );
}
