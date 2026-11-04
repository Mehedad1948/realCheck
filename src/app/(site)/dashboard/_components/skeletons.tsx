import { Skeleton } from '@/components/ui/skeleton';

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-[110px] rounded-xl" />
      ))}
    </div>
  );
}

export function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-[200px] rounded-xl" />
      ))}
    </div>
  );
}

export function ContentSkeleton() {
  return (
    <div className="space-y-6">
      <StatsSkeleton />
      <Skeleton className="h-72 rounded-xl" />
    </div>
  );
}
