'use client';

import useSWR from 'swr';
import type { AlertWithSymbol } from '@/types';

const fetcher = async (url: string): Promise<AlertWithSymbol[]> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  const json = (await res.json()) as { success: boolean; data: AlertWithSymbol[] };
  return json.data;
};

interface CreateAlertBody {
  watchlistId: string;
  condition: Record<string, unknown>;
}

export interface UseAlertsReturn {
  alerts: AlertWithSymbol[];
  isLoading: boolean;
  error: Error | undefined;
  mutate: () => void;
  createAlert: (body: CreateAlertBody) => Promise<void>;
  toggleAlert: (id: string, isActive: boolean) => Promise<void>;
  deleteAlert: (id: string) => Promise<void>;
}

export function useAlerts(): UseAlertsReturn {
  const { data, isLoading, error, mutate } = useSWR<AlertWithSymbol[]>(
    '/api/gateway/alerts',
    fetcher,
    { revalidateOnFocus: false },
  );

  const createAlert = async (body: CreateAlertBody): Promise<void> => {
    const res = await fetch('/api/gateway/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: { message?: string } };
      throw new Error(json.error?.message ?? 'Failed to create alert');
    }
    await mutate();
  };

  const toggleAlert = async (id: string, isActive: boolean): Promise<void> => {
    // Optimistic: flip the flag immediately in the UI
    await mutate(
      async (current = []) => {
        const res = await fetch(`/api/gateway/alerts/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        });
        if (!res.ok) throw new Error('Failed to toggle alert');
        return current.map((a) => (a.id === id ? { ...a, isActive } : a));
      },
      {
        optimisticData: (current = []) =>
          current.map((a) => (a.id === id ? { ...a, isActive } : a)),
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  const deleteAlert = async (id: string): Promise<void> => {
    await mutate(
      async (current = []) => {
        const res = await fetch(`/api/gateway/alerts/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete alert');
        return current.filter((a) => a.id !== id);
      },
      {
        optimisticData: (current = []) => current.filter((a) => a.id !== id),
        rollbackOnError: true,
        revalidate: false,
      },
    );
  };

  return {
    alerts: data ?? [],
    isLoading,
    error: error as Error | undefined,
    mutate,
    createAlert,
    toggleAlert,
    deleteAlert,
  };
}