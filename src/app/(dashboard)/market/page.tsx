import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MarketPage } from '@/components/market/MarketPage';

export const metadata = { title: 'Market Pulse — NexusTrade' };

export default async function MarketPulsePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="mb-5 sm:mb-6 border-b border-border pb-4 sm:pb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
          Market Pulse
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Live indices, sector heat map, top movers, and 39 stocks — one-click add to watchlist.
        </p>
      </div>

      <MarketPage />
    </div>
  );
}
