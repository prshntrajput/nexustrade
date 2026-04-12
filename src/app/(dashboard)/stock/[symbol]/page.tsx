import { notFound } from 'next/navigation';
import { SymbolSchema } from '@/lib/schemas/stock.schema';
import { getFinnhubService } from '@/lib/services/finnhub.service';
import { StockDetailClient } from './StockDetailClient';

interface PageProps {
  params: Promise<{ symbol: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { symbol } = await params;
  return {
    title: `${symbol.toUpperCase()} — NexusTrade`,
    description: `Live price, charts, and AI analysis for ${symbol.toUpperCase()}`,
  };
}

export default async function StockPage({ params }: PageProps) {
  const { symbol: rawSymbol } = await params;
  const upperSymbol = rawSymbol.toUpperCase();

  // Validate symbol format
  const parsed = SymbolSchema.safeParse(upperSymbol);
  if (!parsed.success) notFound();

  const symbol = parsed.data;

  // SSR: fetch initial quote — 404 if symbol doesn't exist
  let initialQuote;
  try {
    initialQuote = await getFinnhubService().getQuote(symbol);
  } catch {
    notFound();
  }

  return (
    <StockDetailClient
      symbol={symbol}
      initialQuote={initialQuote}
    />
  );
}