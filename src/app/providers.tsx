'use client';

import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';

// Global fetcher — unwraps our { success, data } response envelope
async function defaultFetcher(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(json.error?.message ?? `Request failed with status ${res.status}`);
  }
  const json = await res.json() as { data: unknown };
  return json.data;
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: defaultFetcher,
        revalidateOnFocus: false,
        shouldRetryOnError: false,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}