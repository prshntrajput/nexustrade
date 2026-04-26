'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { IndicesBar } from './IndicesBar';
import { MarketMovers } from './MarketMovers';
import { SectorHeatmap } from './SectorHeatmap';
import { StockScreener } from './StockScreener';

function LiveClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZoneName: 'short',
        }),
      );
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, []);

  if (!time) return null;

  return (
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <Activity size={11} className="text-emerald-400 animate-pulse" />
      <span className="tabular-nums">{time}</span>
    </div>
  );
}

export function MarketPage() {
  return (
    <div className="space-y-4">
      {/* Live clock strip */}
      <div className="flex items-center justify-end">
        <LiveClock />
      </div>

      {/* Market indices */}
      <section>
        <IndicesBar />
      </section>

      {/* Movers + Sector heat map */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MarketMovers />
        <SectorHeatmap />
      </section>

      {/* Stock screener */}
      <section>
        <StockScreener />
      </section>
    </div>
  );
}
