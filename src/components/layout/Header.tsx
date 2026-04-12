'use client';

import { usePathname } from 'next/navigation';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Watchlist',
  '/alerts':    'Alerts',
  '/reports':   'AI Reports',
};

export function Header() {
  const pathname = usePathname();

  const stockMatch = pathname.match(/^\/stock\/([A-Z]+)$/);
  const title = stockMatch
    ? stockMatch[1]
    : PAGE_TITLES[pathname] ?? 'NexusTrade';

  return (
    <header
      className={[
        'h-14 shrink-0 flex items-center justify-between',
        // Mobile: pl-14 clears the 50px hamburger (left-4 + p-2 + icon-18)
        // md+: sidebar is visible, hamburger is gone → normal px-6
        'pl-14 pr-4 sm:pl-14 sm:pr-6 md:px-6',
        'border-b border-border bg-background sticky top-0 z-20',
      ].join(' ')}
    >
      {/* Title */}
      <h1 className="text-foreground font-semibold text-[15px] tracking-tight truncate">
        {title}
      </h1>

      {/* Realtime indicator */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground/60 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="hidden xs:inline">Live</span>
        </span>
      </div>
    </header>
  );
}
