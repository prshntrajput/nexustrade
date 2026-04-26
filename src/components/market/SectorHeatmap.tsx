'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { useMarketIndices } from '@/hooks/useMarket';
import { cn } from '@/lib/utils';

function getSectorBg(pct: number): string {
  if (pct > 2)  return 'bg-emerald-500/25 border-emerald-500/40 hover:bg-emerald-500/30';
  if (pct > 1)  return 'bg-emerald-500/15 border-emerald-500/25 hover:bg-emerald-500/20';
  if (pct > 0)  return 'bg-emerald-500/8  border-emerald-500/15 hover:bg-emerald-500/12';
  if (pct > -1) return 'bg-red-500/8  border-red-500/15 hover:bg-red-500/12';
  if (pct > -2) return 'bg-red-500/15 border-red-500/25 hover:bg-red-500/20';
  return             'bg-red-500/25 border-red-500/40 hover:bg-red-500/30';
}

function getSectorText(pct: number): string {
  if (pct > 0) return 'text-emerald-400';
  if (pct < 0) return 'text-red-400';
  return 'text-muted-foreground';
}

export function SectorHeatmap() {
  const { sectors, isLoading } = useMarketIndices();

  if (isLoading) {
    return (
      <div className="bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="p-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {Array.from({ length: 11 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      </div>
    );
  }

  const entries = Object.entries(sectors);

  return (
    <div className="bg-card border border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Sector Performance
        </span>
      </div>
      <div className="p-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
        {entries.map(([etf, { name, quote }]) => (
          <div
            key={etf}
            className={cn(
              'flex flex-col gap-0.5 p-2.5 border transition-colors duration-150 cursor-default select-none',
              getSectorBg(quote.changePercent),
            )}
          >
            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-wider">
              {etf}
            </span>
            <span className="text-[11px] font-medium text-foreground/80 leading-tight truncate">
              {name}
            </span>
            <span
              className={cn(
                'text-[13px] font-bold tabular-nums mt-0.5',
                getSectorText(quote.changePercent),
              )}
            >
              {quote.changePercent > 0 ? '+' : ''}
              {quote.changePercent.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
