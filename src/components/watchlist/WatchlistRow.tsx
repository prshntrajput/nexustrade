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
        'group flex items-center justify-between p-4',
        'bg-gray-900 border border-gray-800 rounded-xl',
        'hover:border-gray-700 transition-all duration-150',
        removing && 'opacity-40 pointer-events-none scale-[0.99]',
      )}
    >
      {/* Symbol + meta */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <TrendingUp size={18} className="text-emerald-500" />
        </div>

        <div className="min-w-0">
          <p className="font-bold text-white text-[15px] leading-snug tracking-wide">
            {item.symbol}
          </p>
          <p className="text-gray-600 text-xs mt-0.5">Added {formatDate(item.addedAt)}</p>
          {item.notes && (
            <p className="text-gray-700 text-xs mt-0.5 truncate max-w-[200px]">
              {item.notes}
            </p>
          )}
        </div>
      </div>

      {/* T22 — Live price ticker (REST initial + real-time WebSocket updates) */}
      <div className="hidden sm:flex flex-col items-end min-w-[140px] mx-4">
        <PriceTicker symbol={item.symbol} showChange />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
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