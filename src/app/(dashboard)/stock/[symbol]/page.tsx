import { ArrowLeft, Construction } from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Stock Detail — NexusTrade' };

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export default async function StockDetailPage({ params }: PageProps) {
  const { symbol } = await params;
  const upper = symbol.toUpperCase();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back nav */}
      <Link
        href="/watchlist"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft size={15} />
        Back to Watchlist
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{upper}</h1>
        <p className="text-gray-500 text-sm mt-1">
          Candlestick chart, indicators, and AI reports.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
          <Construction size={26} className="text-emerald-400" />
        </div>
        <h2 className="text-base font-semibold text-white mb-2">
          Coming in Phase 7
        </h2>
        <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
          Candlestick chart, RSI panel, MACD histogram, news feed, and AI
          report card for <span className="text-white font-medium">{upper}</span> will
          be built in Phase 7.
        </p>
      </div>
    </div>
  );
}