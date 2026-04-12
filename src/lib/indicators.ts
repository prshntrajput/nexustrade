import type { Candle, Indicators } from '@/types';

// ─── EMA (Exponential Moving Average) ────────────────────────────────────────

function calcEMA(values: number[], period: number): number[] {
  if (values.length < period) return [];

  const k = 2 / (period + 1);
  const result: number[] = [];

  // Seed with SMA of the first `period` values
  const seed =
    values.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
  result.push(seed);

  for (let i = period; i < values.length; i++) {
    result.push(values[i]! * k + result[result.length - 1]! * (1 - k));
  }

  return result;
}

// ─── RSI — Wilder's Smoothed Method ──────────────────────────────────────────

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50; // Default neutral

  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i]! - closes[i - 1]!);
  }

  // Initial average gain/loss — simple average of first `period` changes
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    const c = changes[i]!;
    if (c > 0) avgGain += c;
    else avgLoss += Math.abs(c);
  }
  avgGain /= period;
  avgLoss /= period;

  // Wilder's smoothing for remaining changes
  for (let i = period; i < changes.length; i++) {
    const c = changes[i]!;
    avgGain = (avgGain * (period - 1) + (c > 0 ? c : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (c < 0 ? Math.abs(c) : 0)) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

// ─── MACD (12, 26, 9) ────────────────────────────────────────────────────────

function calcMACD(closes: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  const FAST = 12;
  const SLOW = 26;
  const SIGNAL_PERIOD = 9;

  const fallback = { macd: 0, signal: 0, histogram: 0 };
  if (closes.length < SLOW + SIGNAL_PERIOD) return fallback;

  const fastEMA = calcEMA(closes, FAST);
  const slowEMA = calcEMA(closes, SLOW);

  if (fastEMA.length === 0 || slowEMA.length === 0) return fallback;

  // Align: slowEMA[k] corresponds to price[25+k]
  //        fastEMA[k] corresponds to price[11+k]
  // So fastEMA[k + (SLOW-FAST)] aligns with slowEMA[k]
  const offset = SLOW - FAST; // = 14
  const macdLine: number[] = [];

  for (let i = 0; i < slowEMA.length; i++) {
    const fe = fastEMA[i + offset];
    const se = slowEMA[i];
    if (fe === undefined || se === undefined) break;
    macdLine.push(fe - se);
  }

  if (macdLine.length < SIGNAL_PERIOD) return fallback;

  const signalLine = calcEMA(macdLine, SIGNAL_PERIOD);
  const lastMACD = macdLine[macdLine.length - 1] ?? 0;
  const lastSignal = signalLine[signalLine.length - 1] ?? 0;

  return {
    macd: parseFloat(lastMACD.toFixed(4)),
    signal: parseFloat(lastSignal.toFixed(4)),
    histogram: parseFloat((lastMACD - lastSignal).toFixed(4)),
  };
}

// ─── Bollinger Bands (20, 2) ──────────────────────────────────────────────────

function calcBollingerBands(
  closes: number[],
  period = 20,
  multiplier = 2,
): { upper: number; middle: number; lower: number } {
  const last = closes[closes.length - 1] ?? 0;
  const fallback = { upper: last, middle: last, lower: last };
  if (closes.length < period) return fallback;

  const slice = closes.slice(-period);
  const sma = slice.reduce((sum, v) => sum + v, 0) / period;
  const variance = slice.reduce((sum, v) => sum + (v - sma) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: parseFloat((sma + multiplier * stdDev).toFixed(4)),
    middle: parseFloat(sma.toFixed(4)),
    lower: parseFloat((sma - multiplier * stdDev).toFixed(4)),
  };
}

// ─── Public entry point ───────────────────────────────────────────────────────

export function calculateIndicators(candles: Candle[]): Indicators {
  if (candles.length === 0) {
    return {
      rsi14: 50,
      macd: 0,
      signal: 0,
      histogram: 0,
      bbUpper: 0,
      bbMiddle: 0,
      bbLower: 0,
    };
  }

  const closes = candles.map((c) => c.close);
  const rsi14 = parseFloat(calcRSI(closes, 14).toFixed(2));
  const { macd, signal, histogram } = calcMACD(closes);
  const { upper, middle, lower } = calcBollingerBands(closes, 20, 2);

  return {
    rsi14,
    macd,
    signal,
    histogram,
    bbUpper: upper,
    bbMiddle: middle,
    bbLower: lower,
  };
}