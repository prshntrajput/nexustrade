'use client';

import { useMemo, useState } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Candle } from '@/types';
import type { BBPoint } from '@/lib/indicators.chart';

// ─── Custom Candlestick Shape ─────────────────────────────────────────────────

interface ShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  yAxis?: any;
}

function CandlestickShape(props: ShapeProps) {
  const { x = 0, width = 0, payload, yAxis } = props;

  if (!payload || !yAxis?.scale) return <g />;

  const { open, high, low, close } = payload as Candle;
  const isGreen = close >= open;
  const color = isGreen ? '#22c55e' : '#ef4444';
  const scale = yAxis.scale as (v: number) => number;

  const highPx = scale(high);
  const lowPx = scale(low);
  const openPx = scale(open);
  const closePx = scale(close);

  const bodyTop = Math.min(openPx, closePx);
  const bodyH = Math.max(Math.abs(closePx - openPx), 1);
  const centerX = x + width / 2;
  const bodyW = Math.max(width - 2, 1);

  return (
    <g>
      <line
        x1={centerX}
        y1={highPx}
        x2={centerX}
        y2={lowPx}
        stroke={color}
        strokeWidth={1.5}
      />
      <rect
        x={x + 1}
        y={bodyTop}
        width={bodyW}
        height={bodyH}
        fill={isGreen ? '#16a34a' : '#dc2626'}
        fillOpacity={isGreen ? 0.85 : 1}
        stroke={color}
        strokeWidth={0.5}
        rx={1}
      />
    </g>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CandleTooltip({
  active,
  payload,
}: {
  active?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[];
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as Candle & {
    time: number;
    bbUpper: number | null;
    bbMiddle: number | null;
    bbLower: number | null;
  };
  const isGreen = d.close >= d.open;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-2">
        {format(new Date(d.time), 'MMM d, yyyy')}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
        {[
          { label: 'Open', value: d.open },
          { label: 'Close', value: d.close },
          { label: 'High', value: d.high },
          { label: 'Low', value: d.low },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-3">
            <span className="text-gray-500">{label}</span>
            <span
              className={
                label === 'Close'
                  ? isGreen
                    ? 'text-emerald-400 font-semibold'
                    : 'text-red-400 font-semibold'
                  : 'text-white'
              }
            >
              ${(value as number).toFixed(2)}
            </span>
          </div>
        ))}
        <div className="flex justify-between gap-3 col-span-2">
          <span className="text-gray-500">Volume</span>
          <span className="text-white">
            {(d.volume / 1_000_000).toFixed(2)}M
          </span>
        </div>
      </div>

      {/* BB values in tooltip when available */}
      {d.bbUpper != null && (
        <div className="border-t border-gray-800 pt-2 mt-1 space-y-1">
          <p className="text-gray-600 text-[10px] uppercase tracking-wide mb-1">
            Bollinger Bands
          </p>
          {[
            { label: 'Upper', value: d.bbUpper },
            { label: 'Mid', value: d.bbMiddle },
            { label: 'Lower', value: d.bbLower },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-3">
              <span className="text-gray-500">{label}</span>
              <span className="text-violet-400">
                ${(value as number).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Free Plan Notice ─────────────────────────────────────────────────────────

function FreePlanNotice({ symbol }: { symbol: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] bg-gray-900 border border-gray-800 rounded-2xl">
      <div className="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center mb-4">
        <Lock size={22} className="text-gray-600" />
      </div>
      <h3 className="text-white font-semibold text-[15px] mb-2">
        No chart data available for {symbol}
      </h3>
      <p className="text-gray-600 text-sm max-w-[280px] text-center leading-relaxed">
        Could not fetch historical data. Try a different symbol or check back
        later.
      </p>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="h-[400px] bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
  );
}

// ─── BB Toggle Button ─────────────────────────────────────────────────────────

function BBToggle({
  enabled,
  hasData,
  onToggle,
}: {
  enabled: boolean;
  hasData: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={!hasData}
      title={
        hasData ? 'Toggle Bollinger Bands' : 'Not enough data for Bollinger Bands (need 20+ candles)'
      }
      className={cn(
        'px-2.5 py-1 text-[11px] font-semibold border transition-all duration-150',
        'disabled:opacity-30 disabled:cursor-not-allowed',
        enabled
          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
          : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300',
      )}
    >
      BB
    </button>
  );
}

// ─── Main Chart ───────────────────────────────────────────────────────────────

interface CandlestickChartProps {
  candles: Candle[];
  bbSeries: BBPoint[];
  isLoading: boolean;
  isFreeplan: boolean;
  symbol: string;
}

export function CandlestickChart({
  candles,
  bbSeries,
  isLoading,
  isFreeplan,
  symbol,
}: CandlestickChartProps) {
  const [showBB, setShowBB] = useState(true);
  const hasBBData = bbSeries.some((p) => p.upper !== null);

  // Merge BB values into chart data — same index as candles array
  const chartData = useMemo(
    () =>
      candles.map((c, i) => ({
        ...c,
        barValue: c.high,
        bbUpper: bbSeries[i]?.upper ?? null,
        bbMiddle: bbSeries[i]?.middle ?? null,
        bbLower: bbSeries[i]?.lower ?? null,
      })),
    [candles, bbSeries],
  );

  const priceMin = useMemo(() => {
    const lows = candles.map((c) => c.low);
    const bbLowers = showBB
      ? bbSeries.filter((p) => p.lower !== null).map((p) => p.lower!)
      : [];
    return Math.min(...lows, ...bbLowers) * 0.995;
  }, [candles, bbSeries, showBB]);

  const priceMax = useMemo(() => {
    const highs = candles.map((c) => c.high);
    const bbUppers = showBB
      ? bbSeries.filter((p) => p.upper !== null).map((p) => p.upper!)
      : [];
    return Math.max(...highs, ...bbUppers) * 1.005;
  }, [candles, bbSeries, showBB]);

  const volumeMax = useMemo(
    () => Math.max(...candles.map((c) => c.volume)) * 4,
    [candles],
  );

  if (isLoading) return <ChartSkeleton />;
  if (isFreeplan || candles.length === 0) {
    return <FreePlanNotice symbol={symbol} />;
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      {/* BB legend */}
      {showBB && hasBBData && (
        <div className="flex gap-3 mb-3 text-[10px]">
          <span className="flex items-center gap-1.5 text-violet-400">
            <span className="w-4 h-0.5 bg-violet-400 inline-block" /> BB Upper
          </span>
          <span className="flex items-center gap-1.5 text-violet-300">
            <span className="w-4 h-0.5 bg-violet-300 inline-block border-dashed" /> SMA 20
          </span>
          <span className="flex items-center gap-1.5 text-violet-400">
            <span className="w-4 h-0.5 bg-violet-400 inline-block" /> BB Lower
          </span>
          <button
            onClick={() => setShowBB(false)}
            className="ml-auto text-gray-600 hover:text-gray-400 transition-colors"
          >
            Hide
          </button>
        </div>
      )}
      {!showBB && hasBBData && (
        <div className="flex justify-end mb-3">
          <BBToggle
            enabled={false}
            hasData={hasBBData}
            onToggle={() => setShowBB(true)}
          />
        </div>
      )}

      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 16, bottom: 8, left: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#1f2937"
            vertical={false}
          />

          <XAxis
            dataKey="time"
            tickFormatter={(t: number) => format(new Date(t), 'MMM d')}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
          />

          <YAxis
            yAxisId="price"
            domain={[priceMin, priceMax]}
            tickFormatter={(v: number) => `$${v.toFixed(0)}`}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={60}
            orientation="left"
          />

          <YAxis
            yAxisId="volume"
            domain={[0, volumeMax]}
            hide
            orientation="right"
          />

          <Tooltip content={<CandleTooltip />} cursor={false} />

          {/* Volume bars — back layer */}
          <Bar
            yAxisId="volume"
            dataKey="volume"
            maxBarSize={6}
            opacity={0.3}
            radius={[1, 1, 0, 0]}
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.close >= entry.open ? '#22c55e' : '#ef4444'}
              />
            ))}
          </Bar>

          {/* Bollinger Bands — rendered beneath candlesticks */}
          {showBB && hasBBData && (
            <>
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bbUpper"
                stroke="#7c3aed"
                strokeWidth={1}
                strokeOpacity={0.7}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
                strokeDasharray="4 2"
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bbMiddle"
                stroke="#a78bfa"
                strokeWidth={1}
                strokeOpacity={0.5}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
                strokeDasharray="6 3"
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bbLower"
                stroke="#7c3aed"
                strokeWidth={1}
                strokeOpacity={0.7}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
                strokeDasharray="4 2"
              />
            </>
          )}

          {/* Candlestick bars — top layer */}
          <Bar
            yAxisId="price"
            dataKey="barValue"
            shape={<CandlestickShape />}
            isAnimationActive={false}
            maxBarSize={16}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
