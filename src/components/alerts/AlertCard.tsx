'use client';

import { useState } from 'react';
import { Bell, BellOff, Trash2, TrendingUp, TrendingDown, Activity, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlertWithSymbol } from '@/types';

interface AlertCardProps {
  alert: AlertWithSymbol;
  onToggle: (id: string, isActive: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatCondition(alert: AlertWithSymbol): string {
  switch (alert.conditionType) {
    case 'PRICE_ABOVE':
      return `Price above $${Number(alert.threshold).toFixed(2)}`;
    case 'PRICE_BELOW':
      return `Price below $${Number(alert.threshold).toFixed(2)}`;
    case 'RSI_ABOVE':
      return `RSI(14) above ${alert.threshold}`;
    case 'RSI_BELOW':
      return `RSI(14) below ${alert.threshold}`;
    case 'VOLUME_SPIKE':
      return `Volume spike ${alert.multiplier}× above average`;
    default:
      return alert.conditionType;
  }
}

function ConditionIcon({ type }: { type: AlertWithSymbol['conditionType'] }) {
  const cls = 'flex-shrink-0';
  if (type === 'PRICE_ABOVE') return <TrendingUp size={15} className={cls} />;
  if (type === 'PRICE_BELOW') return <TrendingDown size={15} className={cls} />;
  if (type === 'RSI_ABOVE' || type === 'RSI_BELOW')
    return <Activity size={15} className={cls} />;
  return <BarChart2 size={15} className={cls} />;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function AlertCard({ alert, onToggle, onDelete }: AlertCardProps) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggle(alert.id, !alert.isActive);
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(alert.id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        'relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4',
        'bg-card border transition-all duration-200',
        alert.isActive
          ? 'border-border hover:border-primary/40'
          : 'border-border/40 opacity-55 hover:border-border/60',
        deleting && 'scale-[0.98] opacity-30 pointer-events-none',
      )}
    >
      {/* Active indicator stripe */}
      {alert.isActive && (
        <div className="absolute left-0 top-4 bottom-4 w-[2px] bg-primary" />
      )}

      {/* Condition icon */}
      <div
        className={cn(
          'ml-2 flex-shrink-0 w-9 h-9 flex items-center justify-center',
          alert.isActive
            ? 'bg-primary/10 text-primary'
            : 'bg-secondary text-muted-foreground',
        )}
      >
        <ConditionIcon type={alert.conditionType} />
      </div>

      {/* Info — takes all remaining space */}
      <div className="flex-1 min-w-0">
        {/* Symbol + badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-foreground text-sm tracking-wide">
            {alert.symbol}
          </span>
          <span
            className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5',
              alert.isActive
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary text-muted-foreground',
            )}
          >
            {alert.isActive ? 'ACTIVE' : 'PAUSED'}
          </span>
          {(alert.conditionType === 'RSI_ABOVE' ||
            alert.conditionType === 'RSI_BELOW') && (
            <span className="text-[10px] bg-accent text-accent-foreground/80 px-1.5 py-0.5 font-medium">
              SCHEDULED
            </span>
          )}
        </div>

        {/* Condition description */}
        <p className="text-foreground/70 text-sm mt-0.5 truncate">
          {formatCondition(alert)}
        </p>

        {/* Date — hidden on very small screens */}
        <p className="text-muted-foreground/50 text-xs mt-0.5 hidden xs:block sm:block">
          Added {formatDate(alert.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Toggle */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          title={alert.isActive ? 'Pause alert' : 'Resume alert'}
          aria-label={alert.isActive ? 'Pause alert' : 'Resume alert'}
          className={cn(
            'w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-all duration-150',
            toggling && 'opacity-50 cursor-wait',
            alert.isActive
              ? 'bg-primary/10 text-primary hover:bg-primary/20'
              : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          {alert.isActive ? <Bell size={14} /> : <BellOff size={14} />}
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete alert"
          aria-label="Delete alert"
          className={cn(
            'w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-all duration-150',
            'bg-destructive/5 text-destructive/50 hover:bg-destructive/15 hover:text-destructive',
            deleting && 'opacity-50 cursor-wait',
          )}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
