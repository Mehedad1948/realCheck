import { SearchX } from 'lucide-react';
import Link from 'next/link';

export default function MiniAppNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-2 px-8 text-center">
      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-card text-muted-foreground">
        <SearchX className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <h1 className="text-[20px] font-bold">This dataset isn’t available</h1>
      <p className="text-[15px] text-muted-foreground">It may be finished, paused or removed.</p>
      <Link href="/app" className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-[15px] font-semibold text-primary-foreground">
        Browse tasks
      </Link>
    </div>
  );
}
