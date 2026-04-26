'use client';

import Link from 'next/link';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useMarketScreener } from '@/hooks/useMarket';
import { SCREENER_STOCKS } from '@/lib/market-data';
import { cn } from '@/lib/utils';
import type { Quote } from '@/types';

interface StockMover {
  symbol: string;
  name: string;
  quote: Quote;
}

function MoverRow({
  stock,
  variant,
}: {
  stock: StockMover;
  variant: 'gainer' | 'loser';
}) {
  const isGainer = variant === 'gainer';

  return (
    <Link
      href={`/stock/${stock.symbol}`}
      className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors duration-100"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-bold text-foreground">{stock.symbol}</p>
        <p className="text-[11px] text-muted-foreground truncate max-w-[130px]">
          {stock.name}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p
          className={cn(
            'text-[13px] font-bold tabular-nums',
            isGainer ? 'text-emerald-400' : 'text-red-400',
          )}
        >
          {isGainer ? '+' : ''}
          {stock.quote.changePercent.toFixed(2)}%
        </p>
        <p className="text-[11px] text-muted-foreground tabular-nums">
          ${stock.quote.price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
}

function MoversColumn({
  title,
  stocks,
  variant,
  icon: Icon,
  headerClass,
  iconClass,
}: {
  title: string;
  stocks: StockMover[];
  variant: 'gainer' | 'loser';
  icon: React.ElementType;
  headerClass: string;
  iconClass: string;
}) {
  return (
    <div className="bg-card border border-border overflow-hidden flex flex-col">
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 border-b border-border',
          headerClass,
        )}
      >
        <Icon size={13} className={iconClass} />
        <span
          className={cn(
            'text-[11px] font-bold uppercase tracking-wider',
            iconClass,
          )}
        >
          {title}
        </span>
      </div>
      <div className="divide-y divide-border/40 flex-1">
        {stocks.map((s) => (
          <MoverRow key={s.symbol} stock={s} variant={variant} />
        ))}
      </div>
    </div>
  );
}

export function MarketMovers() {
  const { quotes, isLoading } = useMarketScreener();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[0, 1].map((i) => (
          <div key={i} className="bg-card border border-border p-3 space-y-2">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: 5 }).map((_, j) => (
              <Skeleton key={j} className="h-10 w-full" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  const movers: StockMover[] = SCREENER_STOCKS.filter(
    (s) => s.symbol in quotes,
  ).map((s) => ({ symbol: s.symbol, name: s.name, quote: quotes[s.symbol]! }));

  const gainers = [...movers]
    .sort((a, b) => b.quote.changePercent - a.quote.changePercent)
    .slice(0, 5);

  const losers = [...movers]
    .sort((a, b) => a.quote.changePercent - b.quote.changePercent)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-2 gap-3">
      <MoversColumn
        title="Top Gainers"
        stocks={gainers}
        variant="gainer"
        icon={TrendingUp}
        headerClass="bg-emerald-500/5"
        iconClass="text-emerald-400"
      />
      <MoversColumn
        title="Top Losers"
        stocks={losers}
        variant="loser"
        icon={TrendingDown}
        headerClass="bg-red-500/5"
        iconClass="text-red-400"
      />
    </div>
  );
}
