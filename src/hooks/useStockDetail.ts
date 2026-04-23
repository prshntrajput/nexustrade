'use client';

import useSWR from 'swr';
import { useMemo } from 'react';
import type { Quote, CandleResponse, NewsItem, Report } from '@/types';
import {
  calcRSITimeSeries,
  calcMACDTimeSeries,
  calcBBTimeSeries,
} from '@/lib/indicators.chart';

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

// ─── Types ────────────────────────────────────────────────────────────────────

export type Timeframe = '1W' | '1M' | '3M';

// Server adds freePlan: true when Finnhub returns 403
type CandleResponseWithFlag = CandleResponse & { freePlan?: boolean };

const timeframeToMs: Record<Timeframe, number> = {
  '1W': 7 * 86_400_000,
  '1M': 30 * 86_400_000,
  '3M': 90 * 86_400_000,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useStockDetail(symbol: string, timeframe: Timeframe = '1M') {
  // Round to nearest hour — prevents Date.now() from producing a new SWR key
  // on every render, which was causing 3 separate Finnhub calls per page load
  const toHour = Math.floor(Date.now() / 3_600_000) * 3_600_000;
  const from = toHour - timeframeToMs[timeframe];
  const to = toHour;

  // ── Quote (15s polling) ───────────────────────────────────────────────────
  const { data: quote, isLoading: quoteLoading } = useSWR<Quote>(
    `/api/gateway/quote?symbol=${symbol}`,
    fetcher,
    {
      refreshInterval: 15_000,
      revalidateOnMount: true,
      revalidateOnFocus: false,
    },
  );

  // ── Candles (stable hourly key) ───────────────────────────────────────────
  const candlesKey = `/api/gateway/candles?symbol=${symbol}&resolution=D&from=${from}&to=${to}`;

  const { data: candleData, isLoading: candlesLoading } =
    useSWR<CandleResponseWithFlag>(candlesKey, fetcher, {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      // Never retry — 403 will always fail on free plan, no point retrying
      shouldRetryOnError: false,
      // Key already rotates hourly — dedupe for the full hour
      dedupingInterval: 3_600_000,
    });

  // ── News (5min refresh) ───────────────────────────────────────────────────
  const { data: newsData, isLoading: newsLoading } = useSWR<{
    symbol: string;
    news: NewsItem[];
    count: number;
  }>(`/api/gateway/news?symbol=${symbol}&days=7`, fetcher, {
    refreshInterval: 300_000,
    revalidateOnMount: true,
    revalidateOnFocus: false,
  });

  // ── Reports for this symbol (10s polling) ─────────────────────────────────
  const {
    data: reports,
    isLoading: reportsLoading,
    mutate: mutateReports,
  } = useSWR<Report[]>(
    `/api/gateway/reports?symbol=${symbol}&limit=5`,
    fetcher,
    {
      refreshInterval: 10_000,
      revalidateOnMount: true,
    },
  );

  // ── Derived: time-series indicators from candle data ─────────────────────
  const candles = candleData?.candles ?? [];

  // freePlan is explicitly set by the server when Finnhub returns 403
  const isFreeplan = candleData?.freePlan === true;

  const rsiSeries = useMemo(
    () => (candles.length >= 15 ? calcRSITimeSeries(candles) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candles.length, symbol],
  );

  const macdSeries = useMemo(
    () => (candles.length >= 35 ? calcMACDTimeSeries(candles) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candles.length, symbol],
  );

  // Bollinger Bands need 20 candles minimum for the first valid point
  const bbSeries = useMemo(
    () => (candles.length >= 20 ? calcBBTimeSeries(candles) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [candles.length, symbol],
  );

  return {
    // Quote
    quote: quote ?? null,
    quoteLoading,

    // Candles
    candles,
    candlesLoading,
    isFreeplan,

    // Indicators (time-series for charts)
    rsiSeries,
    macdSeries,
    bbSeries,

    // News
    news: newsData?.news ?? [],
    newsLoading,

    // AI Reports
    reports: reports ?? [],
    reportsLoading,
    mutateReports,
  };
}