'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { Lock } from 'lucide-react';
import type { Candle } from '@/types';

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
      {/* Wick: high to low */}
      <line
        x1={centerX}
        y1={highPx}
        x2={centerX}
        y2={lowPx}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Body: open to close */}
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
  const d = payload[0].payload as Candle & { time: number };
  const isGreen = d.close >= d.open;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="text-gray-400 mb-2">
        {format(new Date(d.time), 'MMM d, yyyy')}
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {[
          { label: 'Open', value: d.open },
          { label: 'Close', value: d.close },
          { label: 'High', value: d.high },
          { label: 'Low', value: d.low },
          { label: 'Volume', value: null },
        ]
          .filter((r) => r.value !== null || r.label === 'Volume')
          .map(({ label, value }) => (
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
                {label === 'Volume'
                  ? `${(d.volume / 1_000_000).toFixed(2)}M`
                  : `$${(value as number).toFixed(2)}`}
              </span>
            </div>
          ))}
      </div>
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
        Historical data not available
      </h3>
      <p className="text-gray-600 text-sm max-w-[280px] text-center leading-relaxed mb-4">
        Candlestick charts for {symbol} require a Finnhub paid plan.
        Upgrade at{' '}
        <a
          href="https://finnhub.io/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-500 underline"
        >
          finnhub.io/pricing
        </a>
      </p>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="h-[400px] bg-gray-900 border border-gray-800 rounded-2xl animate-pulse" />
  );
}

// ─── Main Chart ───────────────────────────────────────────────────────────────

interface CandlestickChartProps {
  candles: Candle[];
  isLoading: boolean;
  isFreeplan: boolean;
  symbol: string;
}

export function CandlestickChart({
  candles,
  isLoading,
  isFreeplan,
  symbol,
}: CandlestickChartProps) {
  const chartData = useMemo(
    () =>
      candles.map((c) => ({
        ...c,
        // Bar uses `high` as dataKey so the Y-axis domain covers all wicks
        barValue: c.high,
      })),
    [candles],
  );

  const priceMin = useMemo(
    () => Math.min(...candles.map((c) => c.low)) * 0.995,
    [candles],
  );
  const priceMax = useMemo(
    () => Math.max(...candles.map((c) => c.high)) * 1.005,
    [candles],
  );
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

          {/* X Axis — dates */}
          <XAxis
            dataKey="time"
            tickFormatter={(t: number) => format(new Date(t), 'MMM d')}
            tick={{ fill: '#6b7280', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
          />

          {/* Left Y Axis — price */}
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

          {/* Right Y Axis — volume (smaller, back-layer) */}
          <YAxis
            yAxisId="volume"
            domain={[0, volumeMax]}
            hide
            orientation="right"
          />

          <Tooltip content={<CandleTooltip />} cursor={false} />

          {/* Volume bars — rendered first (back layer) */}
          <Bar
            yAxisId="volume"
            dataKey="volume"
            maxBarSize={6}
            opacity={0.3}
            radius={[1, 1, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.close >= entry.open ? '#22c55e' : '#ef4444'}
              />
            ))}
          </Bar>

          {/* Candlestick bars — custom shape */}
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