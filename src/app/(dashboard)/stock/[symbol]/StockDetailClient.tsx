'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStockFeed } from '@/hooks/useStockFeed';
import { useStockDetail, type Timeframe } from '@/hooks/useStockDetail';
import { CandlestickChart } from '@/components/charts/CandlestickChart';
import { IndicatorPanel } from '@/components/charts/IndicatorPanel';
import { NewsCard } from '@/components/stock/NewsCard';
import { AIReportCard } from '@/components/stock/AIReportCard';
import type { Quote } from '@/types';

// ─── Price Header ─────────────────────────────────────────────────────────────

function PriceHeader({
  symbol,
  initialQuote,
  livePrice,
}: {
  symbol: string;
  initialQuote: Quote;
  livePrice: number | null;
}) {
  const price = livePrice ?? initialQuote.price;
  const change = initialQuote.change;
  const changePct = initialQuote.changePercent;
  const isPositive = change >= 0;
  const isNeutral = change === 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-border">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {symbol}
          </h1>
          {livePrice && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-foreground tabular-nums">
            ${price.toFixed(2)}
          </span>
          <span
            className={cn(
              'flex items-center gap-1 text-lg font-semibold tabular-nums',
              isNeutral
                ? 'text-muted-foreground'
                : isPositive
                  ? 'text-primary'
                  : 'text-destructive',
            )}
          >
            {isNeutral ? (
              <Minus size={16} />
            ) : isPositive ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            {isPositive && '+'}
            {change.toFixed(2)} ({isPositive && '+'}
            {changePct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* OHLC Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Open',       value: initialQuote.open.toFixed(2) },
          { label: 'High',       value: initialQuote.high.toFixed(2) },
          { label: 'Low',        value: initialQuote.low.toFixed(2) },
          { label: 'Prev Close', value: initialQuote.previousClose.toFixed(2) },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <p className="text-muted-foreground/70 text-xs mb-0.5">{label}</p>
            <p className="text-foreground text-sm font-semibold tabular-nums">
              ${value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

const TABS = ['Chart', 'Indicators', 'News', 'AI Analysis'] as const;
type Tab = (typeof TABS)[number];

function TabBar({
  active,
  onChange,
  reportCount,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  reportCount: number;
}) {
  return (
    <div className="flex gap-1 p-1 bg-card border border-border">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium transition-all duration-150',
            active === tab
              ? 'bg-secondary text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground/80',
          )}
        >
          {tab}
          {tab === 'AI Analysis' && reportCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold">
              {reportCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Timeframe Selector ───────────────────────────────────────────────────────

function TimeframeSelector({
  value,
  onChange,
}: {
  value: Timeframe;
  onChange: (t: Timeframe) => void;
}) {
  return (
    <div className="flex gap-1">
      {(['1W', '1M', '3M'] as Timeframe[]).map((tf) => (
        <button
          key={tf}
          onClick={() => onChange(tf)}
          className={cn(
            'px-3 py-1.5 text-xs font-semibold transition-all duration-150',
            value === tf
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground/80',
          )}
        >
          {tf}
        </button>
      ))}
    </div>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function StockDetailClient({
  symbol,
  initialQuote,
}: {
  symbol: string;
  initialQuote: Quote;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('Chart');
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');

  const { tick } = useStockFeed(symbol);
  const livePrice = tick?.price ?? null;

  const {
    candles,
    candlesLoading,
    isFreeplan,
    rsiSeries,
    macdSeries,
    news,
    newsLoading,
    reports,
    reportsLoading,
    mutateReports,
  } = useStockDetail(symbol, timeframe);

  const triggerAnalysis = async () => {
    await fetch('/api/gateway/reports/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ symbol }),
    });
    setTimeout(() => void mutateReports(), 15_000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">

        {/* Back navigation */}
        <Link
          href="/watchlist"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to Watchlist
        </Link>

        {/* Price header */}
        <PriceHeader
          symbol={symbol}
          initialQuote={initialQuote}
          livePrice={livePrice}
        />

        {/* Tabs */}
        <div className="mt-6 mb-5">
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            reportCount={reports.length}
          />
        </div>

        {/* ── Chart Tab ─────────────────────────────────────────────────────── */}
        {activeTab === 'Chart' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground font-semibold">Price Chart</h2>
              <TimeframeSelector value={timeframe} onChange={setTimeframe} />
            </div>
            <CandlestickChart
              candles={candles}
              isLoading={candlesLoading}
              isFreeplan={isFreeplan}
              symbol={symbol}
            />
          </div>
        )}

        {/* ── Indicators Tab ────────────────────────────────────────────────── */}
        {activeTab === 'Indicators' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground font-semibold">Technical Indicators</h2>
              <TimeframeSelector value={timeframe} onChange={setTimeframe} />
            </div>
            <IndicatorPanel
              rsiSeries={rsiSeries}
              macdSeries={macdSeries}
              isLoading={candlesLoading}
              isFreeplan={isFreeplan}
            />
          </div>
        )}

        {/* ── News Tab ──────────────────────────────────────────────────────── */}
        {activeTab === 'News' && (
          <div className="space-y-3">
            <h2 className="text-foreground font-semibold">Recent News</h2>
            {newsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-24 bg-card border border-border animate-pulse"
                  />
                ))}
              </div>
            ) : news.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                No recent news found for {symbol}
              </div>
            ) : (
              news.map((item) => <NewsCard key={item.id} item={item} />)
            )}
          </div>
        )}

        {/* ── AI Analysis Tab ───────────────────────────────────────────────── */}
        {activeTab === 'AI Analysis' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground font-semibold">AI Analysis</h2>
              <button
                onClick={() => void triggerAnalysis()}
                className="flex items-center gap-2 px-3 py-2 bg-primary/15 hover:bg-primary/25 text-primary text-sm font-medium transition-all"
              >
                <Sparkles size={14} />
                Analyze Now
              </button>
            </div>
            {reportsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-64 bg-card border border-border animate-pulse"
                  />
                ))}
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-card border border-border text-center">
                <div className="w-12 h-12 bg-secondary flex items-center justify-center mb-4">
                  <Sparkles size={20} className="text-muted-foreground" />
                </div>
                <h3 className="text-foreground font-semibold mb-1.5">
                  No reports for {symbol} yet
                </h3>
                <p className="text-muted-foreground text-sm max-w-xs">
                  Click &ldquo;Analyze Now&rdquo; to generate an AI-powered
                  analysis using Gemini 2.0 Flash.
                </p>
              </div>
            ) : (
              reports.map((report) => (
                <AIReportCard key={report.id} report={report} />
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
}