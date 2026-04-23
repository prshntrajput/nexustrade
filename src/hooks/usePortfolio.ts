'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import type { Holding } from '@/lib/schemas/portfolio.schema';
import type { Quote } from '@/types';

// ─── Fetcher ──────────────────────────────────────────────────────────────────

const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const json = (await res.json()) as { error?: { message?: string } };
    throw new Error(json.error?.message ?? `${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { success: boolean; data: T };
  return json.data;
};

// ─── Enriched holding with live P&L ──────────────────────────────────────────

export interface HoldingWithMetrics extends Holding {
  currentPrice: number | null;
  currentValue: number | null;
  totalInvested: number;
  unrealizedPnl: number | null;
  unrealizedPnlPct: number | null;
  allocationPct: number | null; // filled after total is known
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePortfolio() {
  const {
    data: holdings,
    isLoading: holdingsLoading,
    mutate: mutateHoldings,
  } = useSWR<Holding[]>('/api/gateway/portfolio', fetcher, {
    revalidateOnFocus: false,
  });

  // Build comma-separated symbols key for the batch quote endpoint
  const symbolsParam = useMemo(
    () =>
      holdings && holdings.length > 0
        ? holdings.map((h) => h.symbol).join(',')
        : null,
    [holdings],
  );

  // Single SWR call fetches all quotes — refreshes every 30s
  const { data: quoteMap, isLoading: quotesLoading } = useSWR<
    Record<string, Quote>
  >(
    symbolsParam ? `/api/gateway/quotes?symbols=${symbolsParam}` : null,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: false },
  );

  // Enrich each holding with live metrics
  const enriched = useMemo<HoldingWithMetrics[]>(() => {
    if (!holdings) return [];

    const rows: HoldingWithMetrics[] = holdings.map((h) => {
      const quote = quoteMap?.[h.symbol];
      const currentPrice = quote?.price ?? null;
      const totalInvested = h.shares * h.avgBuyPrice;
      const currentValue =
        currentPrice !== null ? h.shares * currentPrice : null;
      const unrealizedPnl =
        currentValue !== null ? currentValue - totalInvested : null;
      const unrealizedPnlPct =
        unrealizedPnl !== null ? (unrealizedPnl / totalInvested) * 100 : null;

      return {
        ...h,
        currentPrice,
        currentValue,
        totalInvested,
        unrealizedPnl,
        unrealizedPnlPct,
        allocationPct: null, // computed below after sum is known
      };
    });

    // Compute portfolio total to derive allocation percentages
    const totalValue = rows.reduce(
      (sum, r) => sum + (r.currentValue ?? r.totalInvested),
      0,
    );

    if (totalValue > 0) {
      for (const row of rows) {
        const value = row.currentValue ?? row.totalInvested;
        row.allocationPct = (value / totalValue) * 100;
      }
    }

    return rows;
  }, [holdings, quoteMap]);

  // Portfolio-level summary stats
  const summary = useMemo(() => {
    const totalValue = enriched.reduce(
      (sum, r) => sum + (r.currentValue ?? r.totalInvested),
      0,
    );
    const totalInvested = enriched.reduce((sum, r) => sum + r.totalInvested, 0);
    const totalPnl = totalValue - totalInvested;
    const totalPnlPct =
      totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

    return { totalValue, totalInvested, totalPnl, totalPnlPct };
  }, [enriched]);

  return {
    holdings: enriched,
    holdingsLoading,
    quotesLoading,
    isLoading: holdingsLoading,
    summary,
    mutateHoldings,
  };
}
