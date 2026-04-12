'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { Lock } from 'lucide-react';
import type { RSIPoint, MACDPoint } from '@/lib/indicators.chart';

// ─── Shared tooltip styles ────────────────────────────────────────────────────

function SimpleTooltip({
  active,
  payload,
  label,
  valueKey,
  formatter,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
  label?: number;
  valueKey: string;
  formatter: (v: number) => string;
}) {
  if (!active || !payload?.[0]) return null;
  const value = payload[0].payload[valueKey] as number | null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-500 mb-1">
        {label ? format(new Date(label), 'MMM d') : ''}
      </p>
      <p className="text-white font-semibold">
        {value !== null && value !== undefined ? formatter(value) : 'N/A'}
      </p>
    </div>
  );
}

// ─── RSI Panel ────────────────────────────────────────────────────────────────

function RSIChart({ data }: { data: RSIPoint[] }) {
  const filtered = data.filter((d) => d.rsi !== null);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-sm">RSI (14)</h3>
          <p className="text-gray-600 text-xs mt-0.5">
            Relative Strength Index
          </p>
        </div>
        {filtered.length > 0 && (
          <div
            className={`text-sm font-bold tabular-nums ${
              (filtered.at(-1)?.rsi ?? 50) > 70
                ? 'text-red-400'
                : (filtered.at(-1)?.rsi ?? 50) < 30
                  ? 'text-emerald-400'
                  : 'text-gray-300'
            }`}
          >
            {filtered.at(-1)?.rsi?.toFixed(2)}
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart
          data={filtered}
          margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1f2937"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tickFormatter={(t: number) => format(new Date(t), 'MMM d')}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 30, 50, 70, 100]}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            content={
              <SimpleTooltip
                valueKey="rsi"
                formatter={(v) => v.toFixed(2)}
              />
            }
            cursor={{ stroke: '#374151' }}
          />
          {/* Overbought/Oversold reference lines */}
          <ReferenceLine
            y={70}
            stroke="#ef4444"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
          <ReferenceLine
            y={30}
            stroke="#22c55e"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
          <ReferenceLine y={50} stroke="#374151" strokeOpacity={0.5} />
          <Line
            type="monotone"
            dataKey="rsi"
            stroke="#a78bfa"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex justify-between mt-2 text-[10px] text-gray-700">
        <span className="text-emerald-600">▲ 30 — Oversold</span>
        <span className="text-red-600">▼ 70 — Overbought</span>
      </div>
    </div>
  );
}

// ─── MACD Panel ───────────────────────────────────────────────────────────────

function MACDChart({ data }: { data: MACDPoint[] }) {
  const filtered = data.filter((d) => d.macd !== null);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-sm">MACD (12, 26, 9)</h3>
          <p className="text-gray-600 text-xs mt-0.5">
            Moving Average Convergence Divergence
          </p>
        </div>
        {filtered.length > 0 && (
          <div
            className={`text-sm font-bold tabular-nums ${
              (filtered.at(-1)?.histogram ?? 0) > 0
                ? 'text-emerald-400'
                : 'text-red-400'
            }`}
          >
            {(filtered.at(-1)?.histogram ?? 0) > 0 ? '▲ Bullish' : '▼ Bearish'}
          </div>
        )}
      </div>

      {/* Histogram */}
      <ResponsiveContainer width="100%" height={160}>
        <BarChart
          data={filtered}
          margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1f2937"
            vertical={false}
          />
          <XAxis
            dataKey="time"
            tickFormatter={(t: number) => format(new Date(t), 'MMM d')}
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            content={
              <SimpleTooltip
                valueKey="histogram"
                formatter={(v) => v.toFixed(4)}
              />
            }
            cursor={false}
          />
          <ReferenceLine y={0} stroke="#374151" />
          <Bar dataKey="histogram" maxBarSize={8} isAnimationActive={false}>
            {filtered.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  (entry.histogram ?? 0) > 0 ? '#22c55e' : '#ef4444'
                }
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* MACD + Signal lines */}
      <ResponsiveContainer width="100%" height={120}>
        <LineChart
          data={filtered}
          margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
        >
          <XAxis dataKey="time" hide />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            content={
              <SimpleTooltip
                valueKey="macd"
                formatter={(v) => v.toFixed(4)}
              />
            }
            cursor={{ stroke: '#374151' }}
          />
          <ReferenceLine y={0} stroke="#374151" strokeOpacity={0.5} />
          <Line
            type="monotone"
            dataKey="macd"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            name="MACD"
          />
          <Line
            type="monotone"
            dataKey="signal"
            stroke="#f59e0b"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            name="Signal"
            strokeDasharray="4 2"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 text-[10px]">
        <span className="flex items-center gap-1.5 text-blue-400">
          <span className="w-4 h-0.5 bg-blue-400 inline-block" /> MACD
        </span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <span className="w-4 h-0.5 bg-amber-400 inline-block border-dashed" /> Signal
        </span>
      </div>
    </div>
  );
}

// ─── Free Plan Notice ─────────────────────────────────────────────────────────

function FreePlanNotice() {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-gray-900 border border-gray-800 rounded-2xl text-center">
      <Lock size={22} className="text-gray-600 mb-4" />
      <h3 className="text-white font-semibold mb-2">
        Indicators unavailable
      </h3>
      <p className="text-gray-600 text-sm max-w-xs">
        Technical indicators require historical candle data, which needs a
        Finnhub paid plan.
      </p>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

interface IndicatorPanelProps {
  rsiSeries: RSIPoint[];
  macdSeries: MACDPoint[];
  isLoading: boolean;
  isFreeplan: boolean;
}

export function IndicatorPanel({
  rsiSeries,
  macdSeries,
  isLoading,
  isFreeplan,
}: IndicatorPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-[280px] bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
        <div className="h-[360px] bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isFreeplan || rsiSeries.length === 0) {
    return <FreePlanNotice />;
  }

  return (
    <div className="space-y-4">
      <RSIChart data={rsiSeries} />
      <MACDChart data={macdSeries} />
    </div>
  );
}