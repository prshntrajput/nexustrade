import WebSocket from 'ws';
import { StockTickSchema } from '@/lib/schemas/stock.schema';
import { getAdminClient } from '@/lib/supabase/admin';
import type { StockTick } from '@/types';

const FINNHUB_WS_URL = 'wss://ws.finnhub.io';
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 60_000;
const BROADCAST_THROTTLE_MS = 500;

export class WebSocketManager {
  private static _instance: WebSocketManager | null = null;
  private ws: WebSocket | null = null;
  private readonly apiKey: string;
  private subscribedSymbols = new Set<string>();
  private lastBroadcastAt = new Map<string, number>();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isShuttingDown = false;

  private constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  static getInstance(): WebSocketManager {
    if (!WebSocketManager._instance) {
      const key = process.env.FINNHUB_API_KEY;
      if (!key) throw new Error('[WSManager] FINNHUB_API_KEY is not set');
      WebSocketManager._instance = new WebSocketManager(key);
    }
    return WebSocketManager._instance;
  }

  connect(): void {
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    )
      return;

    console.log('[WSManager] Connecting to Finnhub WebSocket...');
    this.ws = new WebSocket(`${FINNHUB_WS_URL}?token=${this.apiKey}`);

    this.ws.on('open', () => {
      console.log('[WSManager] ✅ Connected to Finnhub WebSocket');
      this.reconnectAttempts = 0;
      for (const symbol of this.subscribedSymbols) {
        this.sendToFinnhub({ type: 'subscribe', symbol });
      }
    });

    this.ws.on('message', (data: WebSocket.RawData) => {
      try {
        this.handleMessage(data.toString());
      } catch {
        // Never crash on a bad message
      }
    });

    this.ws.on('close', (code, reason) => {
      console.warn(`[WSManager] Disconnected: ${code} ${reason.toString()}`);
      if (!this.isShuttingDown) this.scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      console.error('[WSManager] Error:', err.message);
    });
  }

  private handleMessage(raw: string): void {
    const msg = JSON.parse(raw) as Record<string, unknown>;
    if (msg['type'] === 'ping') {
      this.sendToFinnhub({ type: 'pong' });
      return;
    }
    if (msg['type'] !== 'trade') return;
    const trades = msg['data'];
    if (!Array.isArray(trades)) return;
    for (const trade of trades) {
      this.processTrade(trade as Record<string, unknown>);
    }
  }

  private processTrade(trade: Record<string, unknown>): void {
    const result = StockTickSchema.safeParse({
      symbol: trade['s'],
      price: trade['p'],
      volume: trade['v'],
      timestamp: trade['t'],
    });

    if (!result.success) return;
    const tick = result.data;

    // T27 — Evaluate alerts on EVERY tick (no throttle on evaluation)
    void import('@/lib/alert.evaluator').then(({ AlertEvaluator }) => {
      void AlertEvaluator.getInstance().evaluate(tick);
    });

    // Throttle Supabase broadcasts to protect from flooding
    const last = this.lastBroadcastAt.get(tick.symbol) ?? 0;
    if (Date.now() - last < BROADCAST_THROTTLE_MS) return;
    this.lastBroadcastAt.set(tick.symbol, Date.now());

    void this.broadcastTick(tick);
  }

  private async broadcastTick(tick: StockTick): Promise<void> {
    try {
      const channel = getAdminClient().channel(`ticks:${tick.symbol}`);
      await channel.send({ type: 'broadcast', event: 'tick', payload: tick });
    } catch (err) {
      console.warn(`[WSManager] Broadcast failed for ${tick.symbol}:`, err);
    }
  }

  addSymbol(symbol: string): void {
    const upper = symbol.toUpperCase();
    if (this.subscribedSymbols.has(upper)) return;
    this.subscribedSymbols.add(upper);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendToFinnhub({ type: 'subscribe', symbol: upper });
    }
    console.log(`[WSManager] Subscribed to ${upper} (total: ${this.subscribedSymbols.size})`);
  }

  removeSymbol(symbol: string): void {
    const upper = symbol.toUpperCase();
    if (!this.subscribedSymbols.has(upper)) return;
    this.subscribedSymbols.delete(upper);
    this.lastBroadcastAt.delete(upper);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendToFinnhub({ type: 'unsubscribe', symbol: upper });
    }
    console.log(`[WSManager] Unsubscribed from ${upper} (total: ${this.subscribedSymbols.size})`);
  }

  private sendToFinnhub(payload: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  async syncSymbolsFromDatabase(): Promise<void> {
    try {
      const { data, error } = await getAdminClient()
        .from('watchlist')
        .select('symbol');

      if (error) {
        console.warn('[WSManager] DB sync failed:', error.message);
        return;
      }

      const dbSymbols = new Set(
        (data ?? []).map((r: { symbol: string }) => r.symbol.toUpperCase()),
      );

      for (const symbol of dbSymbols) {
        if (!this.subscribedSymbols.has(symbol)) this.addSymbol(symbol);
      }
      for (const symbol of this.subscribedSymbols) {
        if (!dbSymbols.has(symbol)) this.removeSymbol(symbol);
      }

      console.log(`[WSManager] Synced — tracking ${this.subscribedSymbols.size} symbols`);
    } catch (err) {
      console.warn('[WSManager] syncSymbolsFromDatabase error:', err);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WSManager] Max reconnect attempts reached.');
      return;
    }
    const jitter = Math.random() * 500;
    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts) + jitter,
      MAX_RECONNECT_DELAY_MS,
    );
    console.log(
      `[WSManager] Reconnecting in ${(delay / 1000).toFixed(1)}s ` +
        `(attempt ${this.reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`,
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  shutdown(): void {
    this.isShuttingDown = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close(1000, 'Server shutdown');
    console.log('[WSManager] Shut down.');
  }

  getStatus() {
    const stateMap: Record<number, string> = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN',
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED',
    };
    return {
      connectionState: stateMap[this.ws?.readyState ?? WebSocket.CLOSED] ?? 'UNKNOWN',
      isConnected: this.ws?.readyState === WebSocket.OPEN,
      symbolCount: this.subscribedSymbols.size,
      symbols: Array.from(this.subscribedSymbols).sort(),
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}