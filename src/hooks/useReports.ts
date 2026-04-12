'use client';

import useSWR from 'swr';
import { useCallback, useState } from 'react';
import type { Report } from '@/types';

const fetcher = async (url: string): Promise<Report[]> => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const json = (await res.json()) as { error?: { message?: string } };
    throw new Error(json.error?.message ?? `${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { success: boolean; data: Report[] };
  return json.data;
};

export interface UseReportsReturn {
  reports: Report[];
  isLoading: boolean;
  error: Error | undefined;
  mutate: () => void;
  deleteReport: (id: string) => Promise<void>;
  triggerAnalysis: (symbol: string) => Promise<void>;
  isAnalyzing: boolean;
}

export function useReports(): UseReportsReturn {
  // When isAnalyzing is true, poll every 3s. Otherwise every 10s.
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data, isLoading, error, mutate } = useSWR<Report[]>(
    '/api/gateway/reports',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      // Poll fast while waiting for Inngest, slow otherwise
      refreshInterval: isAnalyzing ? 3_000 : 10_000,
    },
  );

  const deleteReport = useCallback(
    async (id: string): Promise<void> => {
      await mutate(
        async (current = []) => {
          const res = await fetch(`/api/gateway/reports/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) throw new Error('Failed to delete report');
          return current.filter((r) => r.id !== id);
        },
        {
          optimisticData: (current = []) =>
            current.filter((r) => r.id !== id),
          rollbackOnError: true,
          revalidate: false,
        },
      );
    },
    [mutate],
  );

  const triggerAnalysis = useCallback(
    async (symbol: string): Promise<void> => {
      const res = await fetch('/api/gateway/reports/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ symbol }),
      });
      if (!res.ok) {
        const json = (await res.json()) as { error?: { message?: string } };
        throw new Error(json.error?.message ?? 'Failed to trigger analysis');
      }

      // Start fast polling — Inngest usually completes in 10-20s
      setIsAnalyzing(true);

      // Stop fast polling after 60s regardless (prevents infinite polling)
      setTimeout(() => setIsAnalyzing(false), 60_000);

      // Also immediately mutate so any cached data is refreshed
      await mutate();
    },
    [mutate],
  );

  return {
    reports: data ?? [],
    isLoading,
    error: error as Error | undefined,
    mutate,
    deleteReport,
    triggerAnalysis,
    isAnalyzing,
  };
}