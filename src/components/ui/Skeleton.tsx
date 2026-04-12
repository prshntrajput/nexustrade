import { cn } from '@/lib/utils';

// ─── Base shimmer ─────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gray-800',
        className,
      )}
    />
  );
}

// ─── Watchlist row skeleton ───────────────────────────────────────────────────

export function WatchlistRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl">
      <div className="flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="hidden sm:flex flex-col items-end gap-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3 w-14" />
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Alert card skeleton ──────────────────────────────────────────────────────

export function AlertCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-900 border border-gray-800 rounded-xl">
      <div className="flex items-center gap-4">
        <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-12 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Report card skeleton ─────────────────────────────────────────────────────

export function ReportCardSkeleton() {
  return (
    <div className="p-5 bg-gray-900 border border-gray-800 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

// ─── News card skeleton ───────────────────────────────────────────────────────

export function NewsCardSkeleton() {
  return (
    <div className="flex gap-4 p-4 bg-gray-900 border border-gray-800 rounded-xl">
      <Skeleton className="w-20 h-16 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-3 pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

// ─── KPI / stat card skeleton ─────────────────────────────────────────────────

export function StatCardSkeleton() {
  return (
    <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-7 w-28" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

// ─── Table row skeleton ───────────────────────────────────────────────────────

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}