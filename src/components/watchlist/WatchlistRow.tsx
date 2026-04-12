'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, ExternalLink, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PriceTicker } from '@/components/stock/PriceTicker';
import { cn } from '@/lib/utils';
import type { WatchlistItem } from '@/types';

interface WatchlistRowProps {
  item: WatchlistItem;
  onRemove: (id: string) => Promise<void>;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function WatchlistRow({ item, onRemove }: WatchlistRowProps) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove(item.id);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4',
        'bg-card border border-border',
        'hover:border-primary/30 transition-all duration-150',
        removing && 'opacity-40 pointer-events-none scale-[0.99]',
      )}
    >
      {/* Symbol + meta */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        {/* Icon — hidden on very small screens to save space */}
        <div className="hidden xs:flex sm:flex w-9 sm:w-10 h-9 sm:h-10 bg-primary/10 border border-primary/20 items-center justify-center flex-shrink-0">
          <TrendingUp size={16} className="text-primary" />
        </div>

        <div className="min-w-0">
          <p className="font-bold text-foreground text-[15px] leading-snug tracking-wide">
            {item.symbol}
          </p>
          <p className="text-muted-foreground/50 text-xs mt-0.5">
            Added {formatDate(item.addedAt)}
          </p>
          {item.notes && (
            <p className="text-muted-foreground/40 text-xs mt-0.5 truncate max-w-[140px] sm:max-w-[200px]">
              {item.notes}
            </p>
          )}
        </div>
      </div>

      {/* Live price ticker — visible from sm up */}
      <div className="hidden sm:flex flex-col items-end min-w-[120px] lg:min-w-[140px] mx-2 sm:mx-4 flex-shrink-0">
        <PriceTicker symbol={item.symbol} showChange />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        <Link
          href={`/stock/${item.symbol}`}
          aria-label={`View ${item.symbol} details`}
        >
          <Button variant="secondary" size="sm">
            <ExternalLink size={13} />
            <span className="hidden sm:inline">View</span>
          </Button>
        </Link>

        <Button
          variant="danger"
          size="icon"
          onClick={handleRemove}
          isLoading={removing}
          aria-label={`Remove ${item.symbol} from watchlist`}
        >
          {!removing && <Trash2 size={14} />}
        </Button>
      </div>
    </div>
  );
}
