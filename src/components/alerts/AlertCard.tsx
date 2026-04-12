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
        'relative flex items-center justify-between gap-4 p-4',
        'bg-gray-900 border rounded-xl transition-all duration-200',
        alert.isActive ? 'border-gray-800' : 'border-gray-800/40 opacity-55',
        deleting && 'scale-[0.98] opacity-30 pointer-events-none',
        'hover:border-gray-700',
      )}
    >
      {/* Active indicator stripe */}
      {alert.isActive && (
        <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-emerald-500 rounded-full" />
      )}

      {/* Icon */}
      <div
        className={cn(
          'ml-2 flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
          alert.isActive
            ? 'bg-emerald-500/10 text-emerald-500'
            : 'bg-gray-800 text-gray-600',
        )}
      >
        <ConditionIcon type={alert.conditionType} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-white text-sm tracking-wide">
            {alert.symbol}
          </span>
          <span
            className={cn(
              'text-[10px] font-semibold px-1.5 py-0.5 rounded',
              alert.isActive
                ? 'bg-emerald-500/10 text-emerald-500'
                : 'bg-gray-800 text-gray-600',
            )}
          >
            {alert.isActive ? 'ACTIVE' : 'PAUSED'}
          </span>
          {(alert.conditionType === 'RSI_ABOVE' ||
            alert.conditionType === 'RSI_BELOW') && (
            <span className="text-[10px] bg-yellow-500/10 text-yellow-600 px-1.5 py-0.5 rounded font-medium">
              SCHEDULED
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm mt-0.5">{formatCondition(alert)}</p>
        <p className="text-gray-700 text-xs mt-0.5">Added {formatDate(alert.createdAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={handleToggle}
          disabled={toggling}
          title={alert.isActive ? 'Pause alert' : 'Resume alert'}
          aria-label={alert.isActive ? 'Pause alert' : 'Resume alert'}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
            toggling && 'opacity-50 cursor-wait',
            alert.isActive
              ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
              : 'bg-gray-800 text-gray-600 hover:bg-gray-700 hover:text-gray-300',
          )}
        >
          {alert.isActive ? <Bell size={14} /> : <BellOff size={14} />}
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete alert"
          aria-label="Delete alert"
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150',
            'bg-red-500/5 text-red-500/50 hover:bg-red-500/15 hover:text-red-400',
            deleting && 'opacity-50 cursor-wait',
          )}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}