'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Trash2, ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { HoldingWithMetrics } from '@/hooks/usePortfolio';

interface HoldingRowProps {
  holding: HoldingWithMetrics;
  onDelete: () => void;
}

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function HoldingRow({ holding: h, onDelete }: HoldingRowProps) {
  const [deleting, setDeleting] = useState(false);

  const isPositive = (h.unrealizedPnl ?? 0) > 0;
  const isNegative = (h.unrealizedPnl ?? 0) < 0;

  const handleDelete = async () => {
    if (!confirm(`Remove ${h.symbol} from your portfolio?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/gateway/portfolio/${h.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`${h.symbol} removed from portfolio`);
      onDelete();
    } catch {
      toast.error('Failed to remove holding');
      setDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        'group grid grid-cols-[1fr_auto] sm:grid-cols-[180px_1fr_1fr_1fr_1fr_auto] gap-2 sm:gap-4',
        'items-center p-3 sm:p-4 bg-card border border-border',
        'hover:border-primary/20 transition-all duration-150',
        deleting && 'opacity-40 pointer-events-none',
      )}
    >
      {/* Symbol + allocation */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={14} className="text-primary" />
        </div>
        <div>
          <p className="font-bold text-foreground text-[15px] tracking-wide">
            {h.symbol}
          </p>
          <p className="text-muted-foreground/50 text-[11px]">
            {h.allocationPct !== null ? `${h.allocationPct.toFixed(1)}% allocation` : '—'}
          </p>
          {h.notes && (
            <p className="text-muted-foreground/40 text-[11px] truncate max-w-[140px]">
              {h.notes}
            </p>
          )}
        </div>
      </div>

      {/* Current price */}
      <div className="hidden sm:block text-right">
        <p className="text-xs text-muted-foreground mb-0.5">Price</p>
        <p className="text-sm font-semibold text-foreground tabular-nums">
          {h.currentPrice !== null ? `$${fmt(h.currentPrice)}` : '—'}
        </p>
        <p className="text-[11px] text-muted-foreground/50 tabular-nums">
          {fmt(h.shares, 4)} shares @ ${fmt(h.avgBuyPrice)}
        </p>
      </div>

      {/* Market value */}
      <div className="hidden sm:block text-right">
        <p className="text-xs text-muted-foreground mb-0.5">Market Value</p>
        <p className="text-sm font-semibold text-foreground tabular-nums">
          {h.currentValue !== null ? `$${fmt(h.currentValue)}` : '—'}
        </p>
        <p className="text-[11px] text-muted-foreground/50 tabular-nums">
          Cost: ${fmt(h.totalInvested)}
        </p>
      </div>

      {/* Unrealized P&L */}
      <div className="hidden sm:block text-right">
        <p className="text-xs text-muted-foreground mb-0.5">Unrealized P&amp;L</p>
        <p
          className={cn(
            'text-sm font-semibold tabular-nums flex items-center justify-end gap-1',
            isPositive
              ? 'text-emerald-400'
              : isNegative
                ? 'text-red-400'
                : 'text-muted-foreground',
          )}
        >
          {isPositive ? (
            <TrendingUp size={12} />
          ) : isNegative ? (
            <TrendingDown size={12} />
          ) : (
            <Minus size={12} />
          )}
          {h.unrealizedPnl !== null
            ? `${h.unrealizedPnl >= 0 ? '+' : ''}$${fmt(Math.abs(h.unrealizedPnl))}`
            : '—'}
        </p>
        <p
          className={cn(
            'text-[11px] tabular-nums',
            isPositive
              ? 'text-emerald-500/70'
              : isNegative
                ? 'text-red-500/70'
                : 'text-muted-foreground/50',
          )}
        >
          {h.unrealizedPnlPct !== null
            ? `${h.unrealizedPnlPct >= 0 ? '+' : ''}${fmt(h.unrealizedPnlPct)}%`
            : '—'}
        </p>
      </div>

      {/* Mobile P&L summary */}
      <div className="sm:hidden text-right">
        <p
          className={cn(
            'text-sm font-semibold tabular-nums',
            isPositive
              ? 'text-emerald-400'
              : isNegative
                ? 'text-red-400'
                : 'text-muted-foreground',
          )}
        >
          {h.unrealizedPnl !== null
            ? `${h.unrealizedPnl >= 0 ? '+' : ''}$${fmt(Math.abs(h.unrealizedPnl))}`
            : '—'}
        </p>
        <p className="text-muted-foreground/50 text-[11px]">
          {h.currentPrice !== null ? `$${fmt(h.currentPrice)}` : '—'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <Link
          href={`/stock/${h.symbol}`}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border transition-all',
            'bg-secondary border-border text-muted-foreground',
            'hover:text-foreground hover:border-primary/30',
          )}
        >
          <ExternalLink size={12} />
          <span className="hidden sm:inline">View</span>
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label={`Remove ${h.symbol}`}
          className={cn(
            'flex items-center justify-center w-8 h-8 border transition-all',
            'bg-secondary border-border text-muted-foreground',
            'hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5',
            'disabled:opacity-50 disabled:cursor-not-allowed',
          )}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
