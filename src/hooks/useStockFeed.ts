'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StockTickSchema } from '@/lib/schemas/stock.schema';
import type { StockTick } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseStockFeedReturn {
  tick: StockTick | null;
  isConnected: boolean;
}

/**
 * T21 — Subscribes to per-symbol Supabase Realtime Broadcast channel.
 * Receives ticks broadcasted by the server-side WebSocket manager.
 * T23 — Re-subscribes on tab visibility change to recover dropped connections.
 */
export function useStockFeed(symbol: string): UseStockFeedReturn {
  const [tick, setTick] = useState<StockTick | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs so callbacks always have fresh values without stale closures
  const channelRef = useRef<RealtimeChannel | null>(null);
  const symbolRef = useRef(symbol);
  symbolRef.current = symbol;

  const supabase = createClient();

  // ─── Subscribe / resubscribe ────────────────────────────────────────────

  const subscribe = useCallback(() => {
    // Clean up existing channel before creating a new one
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`ticks:${symbolRef.current}`)
      .on(
        'broadcast',
        { event: 'tick' },
        ({ payload }: { payload: unknown }) => {
          const result = StockTickSchema.safeParse(payload);
          if (result.success && result.data.symbol === symbolRef.current) {
            setTick(result.data);
          }
        },
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;
  }, [supabase]); // supabase is stable (singleton) — safe dependency

  // ─── Initial subscription ───────────────────────────────────────────────

  useEffect(() => {
    subscribe();

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [symbol, subscribe, supabase]);

  // ─── T23 — visibilitychange: resubscribe when tab comes back to focus ───

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Short delay — give Supabase time to re-establish its own WS first
        setTimeout(subscribe, 600);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [subscribe]);

  return { tick, isConnected };
}