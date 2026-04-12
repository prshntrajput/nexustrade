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
  /** Optional initial price — avoids REST fetch if parent already has it */
  initialPrice?: number;
  /** Show % change alongside price */
  showChange?: boolean;
  className?: string;
}

/**
 * T22 — Self-contained live price display.
 * 1. Fetches initial quote via SWR (REST) for instant display on mount
 * 2. Updates in real-time via useStockFeed (Supabase Broadcast ← Finnhub WS)
 * 3. Flashes green on price UP, red on price DOWN, fades back after 600ms
 * 4. Shows a pulsing connection indicator dot
 */
export function PriceTicker({
  symbol,
  initialPrice,
  showChange = false,
  className,
}: PriceTickerProps) {
  // Initial price from REST (deduped + cached 15s by SWR, matching gateway TTL)
  const { data: quote } = useSWR<Quote>(
    `/api/gateway/quote?symbol=${symbol}`,
    { dedupingInterval: 15_000, revalidateOnFocus: false },
  );

  // Live ticks via WebSocket → Supabase Broadcast
  const { tick, isConnected } = useStockFeed(symbol);

  // Flash state for price direction indicator
  const [flash, setFlash] = useState<FlashState>('neutral');
  const prevPriceRef = useRef<number | undefined>(initialPrice ?? quote?.price);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived current price: live tick > REST quote > initialPrice prop
  const currentPrice = tick?.price ?? quote?.price ?? initialPrice;
  const changePercent = quote?.changePercent ?? 0;

  // ─── Flash on price change ─────────────────────────────────────────────

  useEffect(() => {
    if (!tick) return;

    const prev = prevPriceRef.current;

    if (prev !== undefined && tick.price !== prev) {
      const direction: FlashState = tick.price > prev ? 'up' : 'down';
      setFlash(direction);

      // Clear any existing timer before setting a new one
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);

      flashTimerRef.current = setTimeout(() => {
        setFlash('neutral');
      }, 600);
    }

    prevPriceRef.current = tick.price;

    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, [tick]);

  // ─── Sync prevPriceRef when REST quote loads (before first tick) ────────

  useEffect(() => {
    if (quote?.price !== undefined && prevPriceRef.current === undefined) {
      prevPriceRef.current = quote.price;
    }
  }, [quote?.price]);

  // ─── Render ────────────────────────────────────────────────────────────

  if (currentPrice === undefined) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <span className="font-mono text-sm text-gray-600 tabular-nums">—</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Price value with flash animation */}
      <span
        className={cn(
          'font-mono tabular-nums text-sm font-semibold',
          'transition-colors duration-500',
          flash === 'up' && 'text-emerald-400',
          flash === 'down' && 'text-red-400',
          flash === 'neutral' && 'text-white',
        )}
      >
        ${currentPrice.toFixed(2)}
      </span>

      {/* Direction arrow — only shown during flash */}
      {flash === 'up' && (
        <TrendingUp
          size={13}
          className="text-emerald-400 flex-shrink-0"
          aria-label="Price up"
        />
      )}
      {flash === 'down' && (
        <TrendingDown
          size={13}
          className="text-red-400 flex-shrink-0"
          aria-label="Price down"
        />
      )}

      {/* % change badge from REST quote */}
      {showChange && quote && flash === 'neutral' && (
        <span
          className={cn(
            'text-xs font-medium tabular-nums',
            changePercent >= 0 ? 'text-emerald-500' : 'text-red-500',
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
        >
          {isConnected ? (
            <Wifi size={11} className="text-emerald-600" />
          ) : (
            <WifiOff size={11} className="text-gray-600" />
          )}
        </span>
      )}
    </div>
  );
}