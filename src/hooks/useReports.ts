'use client';

import useSWR from 'swr';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { Report } from '@/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const json = (await res.json()) as { error?: { message?: string } };
    throw new Error(json.error?.message ?? `${res.status}`);
  }
  const json = (await res.json()) as { success: boolean; data: T };
  return json.data;
};

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportFilters {
  symbol?: string;
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | '';
  trigger?: 'alert' | 'manual' | 'scheduled' | '';
}

function buildKey(filters: ReportFilters, limit: number): string {
  const params = new URLSearchParams();
  if (filters.symbol) params.set('symbol', filters.symbol);
  if (filters.sentiment) params.set('sentiment', filters.sentiment);
  if (filters.trigger) params.set('trigger', filters.trigger);
  params.set('limit', String(limit));
  params.set('offset', '0');
  return `/api/gateway/reports?${params.toString()}`;
}

export interface UseReportsReturn {
  reports: Report[];
  isLoading: boolean;
  isAnalyzing: boolean;
  hasMore: boolean;
  filters: ReportFilters;
  setFilters: (f: ReportFilters) => void;
  loadMore: () => void;
  mutate: () => void;
  deleteReport: (id: string) => Promise<void>;
  triggerAnalysis: (symbol: string) => Promise<void>;
}

const PAGE_SIZE = 10;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useReports(initialFilters: ReportFilters = {}): UseReportsReturn {
  const [filters, setFiltersState] = useState<ReportFilters>(initialFilters);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const queryKey = buildKey(filters, limit);

  const { data, isLoading, mutate } = useSWR<Report[]>(queryKey, fetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: false,
  });

  // Reset limit when filters change
  const setFilters = useCallback((f: ReportFilters) => {
    setFiltersState(f);
    setLimit(PAGE_SIZE);
  }, []);

  const loadMore = useCallback(() => {
    setLimit((prev) => prev + PAGE_SIZE);
  }, []);

  // ── Keep mutate stable in the Realtime callback without re-subscribing ──
  const mutateRef = useRef(mutate);
  mutateRef.current = mutate;

  // ── T42 — Supabase Realtime: Postgres Changes on reports INSERT ──────────
  // Root cause of the original error:
  //   React Strict Mode mounts → unmounts → remounts in dev.
  //   The cleanup removes the channel but the async .then() callback can
  //   still run after cleanup, finding a channel with the same name that
  //   is already subscribed — calling .on() on it throws.
  //
  // Fix:
  //   1. `cancelled` flag — if cleanup ran before the async getUser()
  //      resolves, we bail out and never call .channel().on().subscribe().
  //   2. Unique channel name (random suffix) — even if two instances race,
  //      they operate on different Supabase channel objects.

  useEffect(() => {
    const supabase = createClient();

    // Unique per effect invocation — prevents name collision on strict-mode
    // double-mount or any rapid unmount/remount cycle
    const channelId = `reports-rt-${Math.random().toString(36).slice(2, 9)}`;
    let channel: RealtimeChannel | null = null;
    let cancelled = false;

    const setup = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Bail if cleanup already ran while getUser() was resolving
      if (cancelled || !user) return;

      channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'reports',
          },
          (payload) => {
            const row = payload.new as {
              user_id: string;
              symbol: string;
              sentiment: string;
              trigger: string;
            };

            // Belt-and-suspenders: RLS already filters server-side
            if (row.user_id !== user.id) return;

            // Refresh all active report SWR queries
            void mutateRef.current();

            // T43 — Toast based on trigger type
            if (row.trigger === 'alert') {
              toast.success(`🔔 Alert triggered — ${row.symbol}`, {
                description: `AI analysis complete: ${row.sentiment}`,
                duration: 6_000,
              });
            } else {
              toast.success(`✨ Analysis ready — ${row.symbol}`, {
                description: row.sentiment,
                duration: 4_000,
              });
            }
          },
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('[useReports] Realtime channel error — falling back to SWR polling');
          }
        });
    };

    void setup();

    return () => {
      // Signal the async setup to abort if still pending
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, []); // intentionally empty — runs once per mount

  // ── deleteReport ──────────────────────────────────────────────────────────

  const deleteReport = useCallback(
    async (id: string): Promise<void> => {
      await mutate(
        async (current = []) => {
          const res = await fetch(`/api/gateway/reports?id=${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) throw new Error('Failed to delete report');
          return current.filter((r) => r.id !== id);
        },
        {
          optimisticData: (current = []) => current.filter((r) => r.id !== id),
          rollbackOnError: true,
          revalidate: false,
        },
      );
      toast.success('Report deleted');
    },
    [mutate],
  );

  // ── triggerAnalysis ───────────────────────────────────────────────────────

  const triggerAnalysis = useCallback(async (symbol: string): Promise<void> => {
    const res = await fetch('/api/gateway/reports/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ symbol }),
    });

    if (!res.ok) {
      const json = (await res.json()) as { error?: { message?: string } };
      toast.error(`Failed to start analysis for ${symbol}`, {
        description: json.error?.message,
      });
      throw new Error(json.error?.message ?? 'Failed to trigger analysis');
    }

    setIsAnalyzing(true);
    toast.info(`Analyzing ${symbol}…`, {
      description: 'Gemini AI is processing the data. Report appears automatically.',
      duration: 8_000,
    });

    // Reset flag after 90s max regardless of result
    setTimeout(() => setIsAnalyzing(false), 90_000);
  }, []);

  const reports = data ?? [];
  const hasMore = reports.length >= limit;

  return {
    reports,
    isLoading,
    isAnalyzing,
    hasMore,
    filters,
    setFilters,
    loadMore,
    mutate,
    deleteReport,
    triggerAnalysis,
  };
}