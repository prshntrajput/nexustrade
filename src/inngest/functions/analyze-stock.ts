import { inngest } from '@/inngest/client';
import { getFinnhubService } from '@/lib/services/finnhub.service';
import { getGeminiService } from '@/lib/services/gemini.service';
import { calculateIndicators } from '@/lib/indicators';
import { getReportRepository } from '@/lib/repositories/report.repository';
import { ExternalApiError } from '@/lib/errors';
import type { AlertFiredEvent, CandleResponse } from '@/types';

export const analyzeStock = inngest.createFunction(
  {
    id: 'analyze-stock',
    name: 'Analyze Stock on Alert',
    triggers: [{ event: 'stock/alert.fired' }],
    concurrency: { limit: 3 },
    retries: 2,
  },
  async ({ event, step }) => {
    const { userId, symbol, alertId, trigger } =
      event.data as AlertFiredEvent;

    // ── Step 1: Fetch candles — 403 on Finnhub free plan is caught gracefully ─
    const candleData = await step.run('fetch-candles', async () => {
      try {
        const to = Date.now();
        const from = to - 90 * 24 * 60 * 60 * 1000;
        // ✅ await is required — without it, catch never fires on rejection
        return await getFinnhubService().getCandles(symbol, 'D', from, to);
      } catch (err) {
        if (
          err instanceof ExternalApiError &&
          (err.details as { status?: number })?.status === 403
        ) {
          console.warn(
            `[analyzeStock] /stock/candle 403 for ${symbol} — ` +
              `Finnhub free plan excludes historical candles. ` +
              `Proceeding with quote + news only.`,
          );
          // Return empty — calculateIndicators handles this with safe defaults
          return { symbol, candles: [], resolution: 'D' } as CandleResponse;
        }
        throw err; // Re-throw anything unexpected
      }
    });

    // ── Step 2: Calculate indicators (safe defaults on empty candles) ─────────
    const indicators = await step.run('calculate-indicators', async () => {
      return calculateIndicators(candleData.candles);
    });

    // ── Step 3: Fetch recent news ─────────────────────────────────────────────
    const news = await step.run('fetch-news', async () => {
      return getFinnhubService().getCompanyNews(symbol, 7);
    });

    // ── Step 4: Fetch current quote ───────────────────────────────────────────
    const quote = await step.run('fetch-quote', async () => {
      return getFinnhubService().getQuote(symbol);
    });

    // ── Step 5: Call Gemini ───────────────────────────────────────────────────
    const analysis = await step.run('gemini-analysis', async () => {
      const gemini = getGeminiService();
      const recentCloses = candleData.candles.slice(-14).map((c) => c.close);
      const hasCandles = candleData.candles.length >= 34;
      return gemini.analyze(
        symbol,
        quote,
        indicators,
        news,
        recentCloses,
        hasCandles,
      );
    });

    // ── Step 6: Save report ───────────────────────────────────────────────────
    const report = await step.run('save-report', async () => {
      const repo = getReportRepository();
      return repo.create(userId, {
        symbol,
        alertId: alertId ?? null,
        trigger: trigger as 'alert' | 'manual' | 'scheduled',
        summary: analysis.summary,
        sentiment: analysis.sentiment,
        keyRisks: analysis.keyRisks,
        keyOpportunities: analysis.keyOpportunities,
        technicalOutlook: analysis.technicalOutlook,
        indicators,
      });
    });

    console.log(
      `[analyzeStock] ✅ Report saved — ${symbol} (${analysis.sentiment}) id: ${report.id}`,
    );

    return { reportId: report.id, symbol, sentiment: analysis.sentiment };
  },
);