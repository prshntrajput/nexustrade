'use client';

import useSWR from 'swr';
import { useState } from 'react';
import type { WatchlistItem } from '@/types';

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
  // Primary interface — matches WatchlistContent.tsx
  watchlist: WatchlistItem[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  addSymbol: (symbol: string, notes?: string) => Promise<void>;
  removeSymbol: (id: string) => Promise<void>;
  // Aliases — used by AlertsView and ReportsView
  items: WatchlistItem[];
  mutate: () => void;
}

export function useWatchlist(): UseWatchlistReturn {
  const [adding, setAdding] = useState(false);

  const { data, isLoading, error, mutate } = useSWR<WatchlistItem[]>(
    '/api/gateway/watchlist',
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
      const res = await fetch('/api/gateway/watchlist', {
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
        const res = await fetch(`/api/gateway/watchlist/${id}`, {
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
    // Primary interface
    watchlist,
    isLoading,
    isError: !!error,
    errorMessage: error instanceof Error ? error.message : null,
    addSymbol,
    removeSymbol,
    // Aliases for other components that use items/removeItem
    items: watchlist,
    mutate,
  };
}