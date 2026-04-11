'use client';

import { SWRConfig } from 'swr';
import type { ReactNode } from 'react';

interface SWRFallbackProps {
  fallback: Record<string, unknown>;
  children: ReactNode;
}

/**
 * Wraps a subtree with SWR fallback data fetched on the server.
 * Import this in Server Components to pre-populate SWR cache.
 */
export function SWRFallback({ fallback, children }: SWRFallbackProps) {
  return <SWRConfig value={{ fallback }}>{children}</SWRConfig>;
}