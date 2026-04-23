'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, BarChart2, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePortfolio } from '@/hooks/usePortfolio';
import { HoldingRow } from './HoldingRow';
import { AddHoldingForm } from './AddHoldingForm';

// ─── Colour palette for pie slices ───────────────────────────────────────────

const PIE_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316',
  '#6366f1', '#14b8a6',
];

function fmt(n: number, decimals = 2) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="bg-card border border-border p-4">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p
        className={cn(
          'text-xl font-bold tabular-nums',
          trend === 'up'
            ? 'text-emerald-400'
            : trend === 'down'
              ? 'text-red-400'
              : 'text-foreground',
        )}
      >
        {value}
      </p>
      {sub && (
        <p className="text-muted-foreground/60 text-xs mt-0.5 tabular-nums">
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Allocation Pie ───────────────────────────────────────────────────────────

function AllocationPie({
  data,
}: {
  data: { name: string; value: number }[];
}) {
  if (data.length === 0) return null;

  return (
    <div className="bg-card border border-border p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Allocation
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
            isAnimationActive={false}
          >
            {data.map((_, index) => (
              <Cell
                key={index}
                fill={PIE_COLORS[index % PIE_COLORS.length] ?? '#10b981'}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown) => [
              typeof value === 'number' ? `${fmt(value, 1)}%` : '—',
              'Allocation',
            ]}
            contentStyle={{
              backgroundColor: '#111827',
              border: '1px solid #374151',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="space-y-1.5 mt-2">
        {data.map((entry, i) => (
          <div key={entry.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                }}
              />
              <span className="text-xs text-muted-foreground">
                {entry.name}
              </span>
            </div>
            <span className="text-xs font-medium text-foreground tabular-nums">
              {fmt(entry.value, 1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyPortfolio() {
  return (
    <div className="flex flex-col items-center justify-center py-24 bg-card border border-border text-center">
      <div className="w-14 h-14 bg-secondary border border-border flex items-center justify-center mb-4">
        <Wallet size={22} className="text-muted-foreground" />
      </div>
      <h3 className="text-foreground font-semibold mb-1.5">
        Your portfolio is empty
      </h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Add your first holding above to start tracking performance, P&amp;L,
        and allocation.
      </p>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function PortfolioSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-20 bg-card border border-border animate-pulse"
        />
      ))}
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function PortfolioView() {
  const { holdings, isLoading, summary, mutateHoldings } = usePortfolio();

  const pieData = useMemo(
    () =>
      holdings
        .filter((h) => h.allocationPct !== null && h.allocationPct > 0)
        .map((h) => ({ name: h.symbol, value: h.allocationPct! })),
    [holdings],
  );

  const pnlTrend =
    summary.totalPnl > 0
      ? 'up'
      : summary.totalPnl < 0
        ? 'down'
        : 'neutral';

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BarChart2 size={16} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Portfolio
            </h1>
            <p className="text-muted-foreground text-xs">
              {holdings.length} holding{holdings.length !== 1 ? 's' : ''} · prices refresh every 30s
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {holdings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryCard
            label="Total Value"
            value={`$${fmt(summary.totalValue)}`}
            sub={`${holdings.length} positions`}
          />
          <SummaryCard
            label="Total Invested"
            value={`$${fmt(summary.totalInvested)}`}
          />
          <SummaryCard
            label="Unrealized P&L"
            value={`${summary.totalPnl >= 0 ? '+' : ''}$${fmt(Math.abs(summary.totalPnl))}`}
            sub={`${summary.totalPnlPct >= 0 ? '+' : ''}${fmt(summary.totalPnlPct)}%`}
            trend={pnlTrend}
          />
          <SummaryCard
            label="P&L %"
            value={`${summary.totalPnlPct >= 0 ? '+' : ''}${fmt(summary.totalPnlPct)}%`}
            trend={pnlTrend}
          />
        </div>
      )}

      {/* Add Holding */}
      <AddHoldingForm onSuccess={() => void mutateHoldings()} />

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-6">
        {/* Holdings list */}
        <div className="space-y-2">
          {isLoading ? (
            <PortfolioSkeleton />
          ) : holdings.length === 0 ? (
            <EmptyPortfolio />
          ) : (
            <>
              {/* Table header — desktop only */}
              <div className="hidden sm:grid grid-cols-[180px_1fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2">
                {['Symbol', 'Price', 'Market Value', 'P&L', ''].map((col) => (
                  <p key={col} className="text-[11px] text-muted-foreground/60 uppercase tracking-wide font-medium">
                    {col}
                  </p>
                ))}
              </div>

              {holdings.map((h) => (
                <HoldingRow
                  key={h.id}
                  holding={h}
                  onDelete={() => void mutateHoldings()}
                />
              ))}
            </>
          )}
        </div>

        {/* Allocation pie */}
        {pieData.length > 0 && <AllocationPie data={pieData} />}
      </div>

      {/* P&L legend */}
      {holdings.length > 0 && (
        <div className="flex gap-4 text-[11px] text-muted-foreground/60">
          <span className="flex items-center gap-1.5">
            <TrendingUp size={11} className="text-emerald-500" /> Gain
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingDown size={11} className="text-red-500" /> Loss
          </span>
          <span className="flex items-center gap-1.5">
            <Minus size={11} /> Unchanged / no data
          </span>
          <span className="ml-auto">
            Prices from Finnhub · Updated every 30s
          </span>
        </div>
      )}
    </div>
  );
}
