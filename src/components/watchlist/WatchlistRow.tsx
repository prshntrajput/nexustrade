'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
        removing && 'opacity-50 pointer-events-none',
      )}
    >
      {/* Symbol + meta */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <TrendingUp size={18} className="text-emerald-400" />
        </div>

        <div className="min-w-0">
          <p className="font-semibold text-white text-[15px] leading-snug">
            {item.symbol}
          </p>
          <p className="text-gray-500 text-xs mt-0.5">
            Added {formatDate(item.addedAt)}
          </p>
          {item.notes && (
            <p className="text-gray-600 text-xs mt-0.5 truncate max-w-[220px]">
              {item.notes}
            </p>
          )}
        </div>
      </div>

      {/* Price column — live data arrives in Phase 4 */}
      <div className="hidden md:flex flex-col items-end min-w-[110px] mx-4">
        <p className="text-gray-600 text-sm font-mono tabular-nums">—</p>
        <p className="text-gray-700 text-[11px] mt-0.5">Live price in Phase 4</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
        <Link href={`/stock/${item.symbol}`} aria-label={`View ${item.symbol} detail`}>
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