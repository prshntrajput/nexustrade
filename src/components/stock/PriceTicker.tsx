'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { TrendingUp, TrendingDown, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStockFeed } from '@/hooks/useStockFeed';
import type { Quote } from '@/types';

type FlashState = 'up' | 'down' | 'neutral';

interface PriceTickerProps {
  symbol: string;
  initialPrice?: number;
  showChange?: boolean;
  className?: string;
}

export function PriceTicker({
  symbol,
  initialPrice,
  showChange = false,
  className,
}: PriceTickerProps) {
  const { data: quote } = useSWR<Quote>(
    `/api/gateway/quote?symbol=${symbol}`,
    { dedupingInterval: 15_000, revalidateOnFocus: false },
  );

  const { tick, isConnected } = useStockFeed(symbol);

  const [flash, setFlash] = useState<FlashState>('neutral');
  const prevPriceRef  = useRef<number | undefined>(initialPrice ?? quote?.price);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPrice  = tick?.price ?? quote?.price ?? initialPrice;
  const changePercent = quote?.changePercent ?? 0;

  // ─── Flash on price change ────────────────────────────────────────────────

  useEffect(() => {
    if (!tick) return;

    const prev = prevPriceRef.current;

    if (prev !== undefined && tick.price !== prev) {
      const direction: FlashState = tick.price > prev ? 'up' : 'down';
      setFlash(direction);

      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlash('neutral'), 600);
    }

    prevPriceRef.current = tick.price;

    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [tick]);

  // ─── Sync prevPriceRef when REST quote loads ──────────────────────────────

  useEffect(() => {
    if (quote?.price !== undefined && prevPriceRef.current === undefined) {
      prevPriceRef.current = quote.price;
    }
  }, [quote?.price]);

  // ─── Loading state ────────────────────────────────────────────────────────

  if (currentPrice === undefined) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="font-mono text-sm text-muted-foreground/40 tabular-nums">
          —
        </span>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={cn('flex items-center gap-1.5 sm:gap-2 flex-wrap', className)}>

      {/* Price value with flash animation */}
      <span
        className={cn(
          'font-mono tabular-nums text-sm font-semibold transition-colors duration-500',
          flash === 'up'      && 'text-primary',
          flash === 'down'    && 'text-destructive',
          flash === 'neutral' && 'text-foreground',
        )}
      >
        ${currentPrice.toFixed(2)}
      </span>

      {/* Direction arrow — only shown during flash */}
      {flash === 'up' && (
        <TrendingUp
          size={13}
          className="text-primary flex-shrink-0"
          aria-label="Price up"
        />
      )}
      {flash === 'down' && (
        <TrendingDown
          size={13}
          className="text-destructive flex-shrink-0"
          aria-label="Price down"
        />
      )}

      {/* % change badge from REST quote */}
      {showChange && quote && flash === 'neutral' && (
        <span
          className={cn(
            'text-xs font-medium tabular-nums flex-shrink-0',
            changePercent >= 0 ? 'text-primary/80' : 'text-destructive/80',
          )}
        >
          {changePercent >= 0 ? '+' : ''}
          {changePercent.toFixed(2)}%
        </span>
      )}

      {/* Live connection indicator dot */}
      {flash === 'neutral' && (
        <span
          title={isConnected ? 'Live feed connected' : 'Connecting to live feed...'}
          aria-label={isConnected ? 'Live' : 'Connecting'}
          className="flex-shrink-0"
        >
          {isConnected ? (
            <Wifi size={11} className="text-primary/60" />
          ) : (
            <WifiOff size={11} className="text-muted-foreground/40" />
          )}
        </span>
      )}
    </div>
  );
}
