'use client';

import useSWR from 'swr';
import type { Quote } from '@/types';

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const json = (await res.json()) as { error?: { message?: string } };
    throw new Error(json.error?.message ?? `${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { success: boolean; data: T };
  return json.data;
}

export interface SectorEntry {
  name: string;
  quote: Quote;
}

export interface MarketIndicesData {
  indices: Record<string, Quote>;
  sectors: Record<string, SectorEntry>;
}

export const MARKET_INDICES_KEY = '/api/gateway/market/indices';
export const MARKET_SCREENER_KEY = '/api/gateway/market/screener';

export function useMarketIndices() {
  const { data, isLoading, error } = useSWR<MarketIndicesData>(
    MARKET_INDICES_KEY,
    fetcher,
    {
      refreshInterval: 30_000,
      dedupingInterval: 15_000,
      revalidateOnFocus: true,
    },
  );

  return {
    indices: data?.indices ?? {},
    sectors: data?.sectors ?? {},
    isLoading,
    isError: !!error,
  };
}

export function useMarketScreener() {
  const { data, isLoading, error } = useSWR<Record<string, Quote>>(
    MARKET_SCREENER_KEY,
    fetcher,
    {
      refreshInterval: 60_000,
      dedupingInterval: 30_000,
      revalidateOnFocus: false,
    },
  );

  return {
    quotes: data ?? {},
    isLoading,
    isError: !!error,
  };
}
