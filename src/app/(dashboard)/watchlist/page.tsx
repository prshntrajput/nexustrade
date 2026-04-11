import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getWatchlistRepository } from '@/lib/repositories/watchlist.repository';
import { SWRFallback } from '@/components/providers/SWRFallback';
import WatchlistContent from './WatchlistContent';
import { WATCHLIST_KEY } from '@/hooks/useWatchlist';
import type { WatchlistItem } from '@/types';

export const metadata = { title: 'Watchlist — NexusTrade' };

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Server-side prefetch — SWRFallback injects this as SWR's
  // initial cache so there is zero loading flash on first render
  let initialWatchlist: WatchlistItem[] = [];
  try {
    const repo = getWatchlistRepository();
    initialWatchlist = await repo.findByUserId(user.id);
  } catch {
    // Graceful degradation — SWR will re-fetch on the client
    initialWatchlist = [];
  }

  return (
    <SWRFallback fallback={{ [WATCHLIST_KEY]: initialWatchlist }}>
      {/* Page header — static, server-rendered */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor live prices, set alerts, and trigger AI analysis.
          </p>
        </div>

        {/* Client island — owns all interactivity */}
        <WatchlistContent />
      </div>
    </SWRFallback>
  );
}