'use client';

import { usePathname } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Watchlist',
  '/alerts': 'Alerts',
  '/reports': 'AI Reports',
};

export function Header() {
  const pathname = usePathname();

  // Match /stock/[symbol] dynamically
  const stockMatch = pathname.match(/^\/stock\/([A-Z]+)$/);
  const title = stockMatch
    ? stockMatch[1]
    : PAGE_TITLES[pathname] ?? 'NexusTrade';

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-gray-800 bg-gray-950 sticky top-0 z-20">
      <h1 className="text-white font-semibold text-[15px] tracking-tight">
        {title}
      </h1>

      {/* Realtime indicator */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs text-gray-600">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>
    </header>
  );
}