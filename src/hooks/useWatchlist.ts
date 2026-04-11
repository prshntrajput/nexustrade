'use client';

import useSWR from 'swr';
import type { WatchlistItem } from '@/types';

export const WATCHLIST_KEY = '/api/gateway/watchlist';

export function useWatchlist() {
  const { data, error, isLoading, mutate } = useSWR<WatchlistItem[]>(WATCHLIST_KEY);

  // ─── Add symbol — optimistic update ─────────────────────────────────────

  const addSymbol = async (symbol: string, notes?: string): Promise<void> => {
    const upper = symbol.toUpperCase();

    // Optimistic placeholder inserted immediately
    const optimistic: WatchlistItem = {
      id: `optimistic-${Date.now()}`,
      userId: '',
      symbol: upper,
      addedAt: new Date().toISOString(),
      notes: notes ?? null,
    };

    await mutate(
      async () => {
        const res = await fetch(WATCHLIST_KEY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symbol: upper, notes }),
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(json.error?.message ?? 'Failed to add symbol');
        }

        const json = (await res.json()) as { data: WatchlistItem };
        // Replace optimistic placeholder with real server data
        return [...(data ?? []), json.data];
      },
      {
        optimisticData: [...(data ?? []), optimistic],
        rollbackOnError: true,
        revalidate: true,
      },
    );
  };

  // ─── Remove symbol — optimistic update ──────────────────────────────────

  const removeSymbol = async (id: string): Promise<void> => {
    const afterRemoval = (data ?? []).filter((item) => item.id !== id);

    await mutate(
      async () => {
        const res = await fetch(`/api/gateway/watchlist/${id}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as {
            error?: { message?: string };
          };
          throw new Error(json.error?.message ?? 'Failed to remove symbol');
        }

        return afterRemoval;
      },
      {
        optimisticData: afterRemoval,
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  return {
    watchlist: data ?? [],
    isLoading,
    isError: Boolean(error),
    errorMessage: error instanceof Error ? error.message : null,
    addSymbol,
    removeSymbol,
  };
}