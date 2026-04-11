import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-gray-800', className)}
    />
  );
}

// Pre-composed skeleton matching WatchlistRow layout
export function WatchlistRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl">
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-1">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}