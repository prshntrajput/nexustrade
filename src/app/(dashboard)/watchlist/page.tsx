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

  let initialWatchlist: WatchlistItem[] = [];
  try {
    const repo = getWatchlistRepository();
    initialWatchlist = await repo.findByUserId(user.id);
  } catch {
    initialWatchlist = [];
  }

  return (
    <SWRFallback fallback={{ [WATCHLIST_KEY]: initialWatchlist }}>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

        {/* Page header */}
        <div className="mb-5 sm:mb-6 border-b border-border pb-4 sm:pb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            Watchlist
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitor live prices, set alerts, and trigger AI analysis.
          </p>
        </div>

        {/* Client island */}
        <WatchlistContent />

      </div>
    </SWRFallback>
  );
}
