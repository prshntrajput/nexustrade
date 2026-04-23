import { inngest } from '@/inngest/client';
import { getFinnhubService } from '@/lib/services/finnhub.service';
import { getYahooService } from '@/lib/services/yahoo.service';
import { getGeminiService } from '@/lib/services/gemini.service';
import { calculateIndicators } from '@/lib/indicators';
import { getReportRepository } from '@/lib/repositories/report.repository';
import type { AlertFiredEvent } from '@/types';

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

    // ── Step 1: Fetch 90-day daily candles from Yahoo Finance (always free) ──
    const candleData = await step.run('fetch-candles', async () => {
      const to = Date.now();
      const from = to - 90 * 24 * 60 * 60 * 1000;
      try {
        return await getYahooService().getCandles(symbol, from, to);
      } catch (err) {
        console.warn(
          `[analyzeStock] Yahoo Finance failed for ${symbol} — ` +
            `proceeding with quote + news only. Error: ${err instanceof Error ? err.message : String(err)}`,
        );
        return { symbol, candles: [], resolution: 'D' };
      }
    });

    // ── Step 2: Calculate technical indicators ────────────────────────────────
    const indicators = await step.run('calculate-indicators', async () => {
      return calculateIndicators(candleData.candles);
    });

    // ── Step 3: Fetch recent company news ────────────────────────────────────
    const news = await step.run('fetch-news', async () => {
      return getFinnhubService().getCompanyNews(symbol, 7);
    });

    // ── Step 4: Fetch current quote ───────────────────────────────────────────
    const quote = await step.run('fetch-quote', async () => {
      return getFinnhubService().getQuote(symbol);
    });

    // ── Step 5: Run Gemini analysis ───────────────────────────────────────────
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

    // ── Step 6: Persist the report ────────────────────────────────────────────
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

    console.warn(
      `[analyzeStock] report saved — ${symbol} (${analysis.sentiment}) id: ${report.id}`,
    );

    return { reportId: report.id, symbol, sentiment: analysis.sentiment };
  },
);
