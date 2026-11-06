import { SearchX } from 'lucide-react';
import Link from 'next/link';

export default function MiniAppNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-2 px-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card text-muted-foreground ring-1 ring-border ring-inset">
        <SearchX className="h-7 w-7" strokeWidth={1.25} />
      </div>
      <h1 className="text-[28px] leading-tight font-[300] tracking-[-0.03em]">This dataset isn’t available</h1>
      <p className="text-[15px] text-muted-foreground">It may be finished, paused or removed.</p>
      <Link href="/app" className="mt-6 rounded-full bg-foreground px-6 py-3 text-[15px] font-medium text-background">
        Browse tasks
      </Link>
    </div>
  );
}
