import type { Candle } from '@/types';

export interface BBPoint {
  time: number;
  upper: number | null;
  middle: number | null;
  lower: number | null;
}

// ─── Bollinger Bands Time Series (20, 2) ──────────────────────────────────────

export function calcBBTimeSeries(
  candles: Candle[],
  period = 20,
  multiplier = 2,
): BBPoint[] {
  return candles.map((c, i) => {
    if (i < period - 1) {
      return { time: c.time, upper: null, middle: null, lower: null };
    }

    const slice = candles.slice(i - period + 1, i + 1).map((x) => x.close);
    const sma = slice.reduce((sum, v) => sum + v, 0) / period;
    const variance =
      slice.reduce((sum, v) => sum + (v - sma) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      time: c.time,
      upper: parseFloat((sma + multiplier * stdDev).toFixed(4)),
      middle: parseFloat(sma.toFixed(4)),
      lower: parseFloat((sma - multiplier * stdDev).toFixed(4)),
    };
  });
}

export interface RSIPoint {
  time: number;
  rsi: number | null;
}

export interface MACDPoint {
  time: number;
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

// ─── EMA (returns array aligned to input values) ──────────────────────────────

function emaTimeSeries(values: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(period - 1).fill(null);
  if (values.length < period) return out;

  const k = 2 / (period + 1);
  let ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out.push(ema);

  for (let i = period; i < values.length; i++) {
    ema = values[i]! * k + ema * (1 - k);
    out.push(ema);
  }
  return out;
}

// ─── RSI Time Series (Wilder's Smoothing) ─────────────────────────────────────

export function calcRSITimeSeries(
  candles: Candle[],
  period = 14,
): RSIPoint[] {
  const result: RSIPoint[] = [];

  // Not enough data — all null
  if (candles.length < period + 1) {
    return candles.map((c) => ({ time: c.time, rsi: null }));
  }

  const changes: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    changes.push(candles[i]!.close - candles[i - 1]!.close);
  }

  // First `period` candles have no RSI
  for (let i = 0; i < period; i++) {
    result.push({ time: candles[i]!.time, rsi: null });
  }

  // Seed averages
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    const c = changes[i]!;
    if (c > 0) avgGain += c;
    else avgLoss += Math.abs(c);
  }
  avgGain /= period;
  avgLoss /= period;

  const firstRSI =
    avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  result.push({
    time: candles[period]!.time,
    rsi: parseFloat(firstRSI.toFixed(2)),
  });

  // Wilder's smoothing for remaining
  for (let i = period; i < changes.length; i++) {
    const c = changes[i]!;
    avgGain = (avgGain * (period - 1) + (c > 0 ? c : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (c < 0 ? Math.abs(c) : 0)) / period;
    const rsi =
      avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    result.push({
      time: candles[i + 1]!.time,
      rsi: parseFloat(rsi.toFixed(2)),
    });
  }

  return result;
}

// ─── MACD Time Series (12, 26, 9) ─────────────────────────────────────────────

export function calcMACDTimeSeries(candles: Candle[]): MACDPoint[] {
  const FAST = 12;
  const SLOW = 26;
  const SIG = 9;

  const closes = candles.map((c) => c.close);
  const fastEMA = emaTimeSeries(closes, FAST);
  const slowEMA = emaTimeSeries(closes, SLOW);

  // MACD line (aligned to candle index)
  const macdLine: (number | null)[] = closes.map((_, i) => {
    const fe = fastEMA[i];
    const se = slowEMA[i];
    if (fe == null || se == null) return null;
    return fe - se;
  });

  // EMA of MACD values only (compact)
  const macdCompact = macdLine.filter((v): v is number => v !== null);
  const signalCompact = emaTimeSeries(macdCompact, SIG);

  // Expand signal back to full array
  let si = 0;
  const signalLine: (number | null)[] = macdLine.map((m) => {
    if (m === null) return null;
    const sv = signalCompact[si] ?? null;
    si++;
    return sv;
  });

  return candles.map((c, i) => {
    const m = macdLine[i] ?? null;
    const s = signalLine[i] ?? null;
    return {
      time: c.time,
      macd: m !== null ? parseFloat(m.toFixed(4)) : null,
      signal: s !== null ? parseFloat(s.toFixed(4)) : null,
      histogram:
        m !== null && s !== null ? parseFloat((m - s).toFixed(4)) : null,
    };
  });
}