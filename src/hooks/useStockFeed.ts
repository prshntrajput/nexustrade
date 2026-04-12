'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
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
 * T43 — Shows toast on disconnect and reconnect.
 */
export function useStockFeed(symbol: string): UseStockFeedReturn {
  const [tick, setTick] = useState<StockTick | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Refs so callbacks always have fresh values without stale closures
  const channelRef = useRef<RealtimeChannel | null>(null);
  const symbolRef = useRef(symbol);
  symbolRef.current = symbol;

  // Track whether we were previously connected so we can distinguish
  // "initial connect" from "reconnect" for the toast message
  const wasConnectedRef = useRef(false);

  // Track whether we already showed a disconnect toast to avoid duplicates
  // across rapid disconnect/reconnect cycles
  const disconnectToastShownRef = useRef(false);

  const supabase = createClient();

  // ─── Subscribe / resubscribe ──────────────────────────────────────────────

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
        const connected = status === 'SUBSCRIBED';
        setIsConnected(connected);

        // ── T43 — Reconnect toast ─────────────────────────────────────────
        if (connected) {
          if (wasConnectedRef.current === false && disconnectToastShownRef.current) {
            // Was disconnected before — this is a reconnect, show recovery toast
            toast.success('Live feed reconnected', {
              description: `Real-time prices restored for ${symbolRef.current}`,
              duration: 3_000,
              id: `ws-reconnect-${symbolRef.current}`, // dedupes rapid events
            });
          }
          wasConnectedRef.current = true;
          disconnectToastShownRef.current = false;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          wasConnectedRef.current = false;

          // Only show disconnect toast once per disconnection event
          if (!disconnectToastShownRef.current) {
            disconnectToastShownRef.current = true;
            toast.warning('Live feed disconnected', {
              description: 'Reconnecting automatically…',
              duration: 4_000,
              id: `ws-disconnect-${symbolRef.current}`, // dedupes rapid events
            });
          }
        }

        if (status === 'CLOSED') {
          wasConnectedRef.current = false;
          setIsConnected(false);
        }
      });

    channelRef.current = channel;
  }, [supabase]); // supabase is stable (singleton) — safe dependency

  // ─── Initial subscription ─────────────────────────────────────────────────

  useEffect(() => {
    subscribe();

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
      // Reset state on unmount so next mount starts fresh
      wasConnectedRef.current = false;
      disconnectToastShownRef.current = false;
    };
  }, [symbol, subscribe, supabase]);

  // ─── T23 — visibilitychange: resubscribe when tab comes back to focus ────

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