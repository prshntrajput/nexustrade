import { GoogleGenAI } from '@google/genai';
import type { Quote, NewsItem, Indicators } from '@/types';

export interface GeminiAnalysis {
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  keyRisks: string[];
  keyOpportunities: string[];
  technicalOutlook: string;
}

function buildPrompt(
  symbol: string,
  quote: Quote,
  indicators: Indicators,
  news: NewsItem[],
  recentCloses: number[],
  hasCandles: boolean,
): string {
  const newsLines =
    news.length > 0
      ? news
          .slice(0, 5)
          .map((n) => `• ${n.headline} (${n.source})`)
          .join('\n')
      : 'No recent news available.';

  const technicalSection = hasCandles
    ? `TECHNICAL INDICATORS (calculated from 90-day daily candles):
• RSI(14): ${indicators.rsi14.toFixed(2)}${indicators.rsi14 > 70 ? ' — Overbought' : indicators.rsi14 < 30 ? ' — Oversold' : ' — Neutral'}
• MACD: ${indicators.macd.toFixed(4)}  |  Signal: ${indicators.signal.toFixed(4)}  |  Histogram: ${indicators.histogram.toFixed(4)}${indicators.histogram > 0 ? ' — Bullish momentum' : ' — Bearish momentum'}
• Bollinger Bands: Upper $${indicators.bbUpper.toFixed(2)}  |  Mid $${indicators.bbMiddle.toFixed(2)}  |  Lower $${indicators.bbLower.toFixed(2)}

RECENT CLOSES (${recentCloses.length} trading days, oldest → newest):
${recentCloses.map((p) => `$${p.toFixed(2)}`).join(', ')}`
    : `TECHNICAL INDICATORS: Not available on Finnhub free plan.
Base your technical outlook on intraday price action (high/low vs previous close) and news sentiment only.`;

  return `You are a professional equity analyst. Analyze ${symbol} using the data below.

PRICE DATA:
• Current: $${quote.price.toFixed(2)}  |  Change: ${quote.change >= 0 ? '+' : ''}${quote.change.toFixed(2)} (${quote.changePercent.toFixed(2)}%)
• Day High: $${quote.high.toFixed(2)}  |  Day Low: $${quote.low.toFixed(2)}  |  Prev Close: $${quote.previousClose.toFixed(2)}

${technicalSection}

RECENT NEWS:
${newsLines}

Respond with a JSON object matching this schema exactly:
{
  "summary": string (2-3 sentences about ${symbol}'s current situation),
  "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL",
  "keyRisks": string[] (3 items),
  "keyOpportunities": string[] (3 items),
  "technicalOutlook": string (1-2 sentences on price action and technicals)
}`;
}

export class GeminiService {
  private readonly ai: GoogleGenAI;
  private readonly modelName: string;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.modelName = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
  }

  async analyze(
    symbol: string,
    quote: Quote,
    indicators: Indicators,
    news: NewsItem[],
    recentCloses: number[],
    hasCandles = true,
  ): Promise<GeminiAnalysis> {
    const prompt = buildPrompt(
      symbol,
      quote,
      indicators,
      news,
      recentCloses,
      hasCandles,
    );

    let rawText: string;
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          temperature: 0.3,
          maxOutputTokens: 2048,           // ← was 1024 — too low, truncated JSON
          responseMimeType: 'application/json', // ← forces valid JSON via constrained decoding
        },
      });
      rawText = response.text ?? '';
    } catch (err) {
      throw new Error(
        `Gemini API call failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // responseMimeType guarantees valid JSON — but still clean just in case
    const clean = rawText
      .trim()
      .replace(/^```json\s*/m, '')
      .replace(/^```\s*/m, '')
      .replace(/\s*```$/m, '')
      .trim();

    let parsed: GeminiAnalysis;
    try {
      parsed = JSON.parse(clean) as GeminiAnalysis;
    } catch {
      // Log the full raw text so you can see exactly what Gemini returned
      console.error('[GeminiService] JSON.parse failed. Full raw response:');
      console.error(rawText);
      throw new Error(
        `Gemini returned non-JSON response: ${clean.slice(0, 500)}`,
      );
    }

    // Sanitize fields
    const validSentiments: GeminiAnalysis['sentiment'][] = [
      'BULLISH',
      'BEARISH',
      'NEUTRAL',
    ];
    if (!validSentiments.includes(parsed.sentiment)) parsed.sentiment = 'NEUTRAL';
    if (!Array.isArray(parsed.keyRisks)) parsed.keyRisks = [];
    if (!Array.isArray(parsed.keyOpportunities)) parsed.keyOpportunities = [];
    if (typeof parsed.summary !== 'string') parsed.summary = '';
    if (typeof parsed.technicalOutlook !== 'string') parsed.technicalOutlook = '';

    return {
      summary: parsed.summary,
      sentiment: parsed.sentiment,
      keyRisks: parsed.keyRisks.slice(0, 5),
      keyOpportunities: parsed.keyOpportunities.slice(0, 5),
      technicalOutlook: parsed.technicalOutlook,
    };
  }
}

let _geminiService: GeminiService | null = null;

export function getGeminiService(): GeminiService {
  if (_geminiService) return _geminiService;
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY environment variable is not set');
  _geminiService = new GeminiService(key);
  return _geminiService;
}