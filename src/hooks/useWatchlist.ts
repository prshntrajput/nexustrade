'use client';

import useSWR from 'swr';
import { useState } from 'react';
import type { WatchlistItem } from '@/types';

// ← Add this one line — exported so WatchlistPage (server component) can
// use it as the SWR fallback key for zero-flash prefetching
export const WATCHLIST_KEY = '/api/gateway/watchlist';

const fetcher = async (url: string): Promise<WatchlistItem[]> => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const json = (await res.json()) as { error?: { message?: string } };
    throw new Error(json.error?.message ?? `${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as {
    success: boolean;
    data: WatchlistItem[];
  };
  return json.data;
};

export interface UseWatchlistReturn {
  watchlist: WatchlistItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  addSymbol: (symbol: string, notes?: string) => Promise<void>;
  removeSymbol: (id: string) => Promise<void>;
  items: WatchlistItem[];
  mutate: () => void;
}

export function useWatchlist(): UseWatchlistReturn {
  const [adding, setAdding] = useState(false);

  const { data, isLoading, error, mutate } = useSWR<WatchlistItem[]>(
    WATCHLIST_KEY, // ← use the constant instead of the string literal
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 2_000,
    },
  );

  const watchlist = data ?? [];

  const addSymbol = async (symbol: string, notes = ''): Promise<void> => {
    if (adding) return;
    setAdding(true);
    try {
      const res = await fetch(WATCHLIST_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ symbol: symbol.toUpperCase(), notes }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? 'Failed to add symbol');
      }
      await mutate();
    } finally {
      setAdding(false);
    }
  };

  const removeSymbol = async (id: string): Promise<void> => {
    await mutate(
      async (current = []) => {
        const res = await fetch(`${WATCHLIST_KEY}/${id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (!res.ok) throw new Error('Failed to remove symbol');
        return current.filter((item) => item.id !== id);
      },
      {
        optimisticData: (current = []) =>
          current.filter((item) => item.id !== id),
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  return {
    watchlist,
    isLoading,
    isError: !!error,
    errorMessage: error instanceof Error ? error.message : null,
    addSymbol,
    removeSymbol,
    items: watchlist,
    mutate,
  };
}