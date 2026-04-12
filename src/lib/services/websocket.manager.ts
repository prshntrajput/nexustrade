import WebSocket from 'ws';
import { StockTickSchema } from '@/lib/schemas/stock.schema';
import { getAdminClient } from '@/lib/supabase/admin';
import type { StockTick } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const FINNHUB_WS_URL = 'wss://ws.finnhub.io';
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 60_000;

// Throttle: max 1 broadcast per symbol per 500ms (prevents flooding Supabase)
const BROADCAST_THROTTLE_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── WebSocketManager ─────────────────────────────────────────────────────────

/**
 * T18 — Singleton that maintains a persistent Finnhub WebSocket connection.
 *
 * NOTE on Vercel: Vercel Serverless Functions are stateless — this singleton
 * will NOT persist between invocations. For Vercel, deploy this service to a
 * persistent runtime (Railway, Render, Fly.io) or use Inngest polling instead.
 * This implementation is correct for local dev and any Node.js server.
 */
export class WebSocketManager {
  private static _instance: WebSocketManager | null = null;

  private ws: WebSocket | null = null;
  private apiKey: string;

  // T19 — symbols we are subscribed to on Finnhub WS
  private subscribedSymbols = new Set<string>();

  // Throttle tracking
  private lastBroadcastAt = new Map<string, number>();

  // Reconnect state (T23)
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isShuttingDown = false;

  private constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // ─── Singleton accessor ───────────────────────────────────────────────────

  static getInstance(): WebSocketManager {
    if (!WebSocketManager._instance) {
      const key = process.env.FINNHUB_API_KEY;
      if (!key) throw new Error('[WSManager] FINNHUB_API_KEY is not set');
      WebSocketManager._instance = new WebSocketManager(key);
    }
    return WebSocketManager._instance;
  }

  // ─── Connect ─────────────────────────────────────────────────────────────

  connect(): void {
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) {
      return;
    }

    console.log('[WSManager] Connecting to Finnhub WebSocket...');

    this.ws = new WebSocket(`${FINNHUB_WS_URL}?token=${this.apiKey}`);

    this.ws.on('open', () => {
      console.log('[WSManager] ✅ Connected to Finnhub WebSocket');
      this.reconnectAttempts = 0;

      // T19 — Re-subscribe all tracked symbols after reconnect
      for (const symbol of this.subscribedSymbols) {
        this.sendToFinnhub({ type: 'subscribe', symbol });
      }
    });

    // T19 — Parse and validate every incoming tick
    this.ws.on('message', (data: WebSocket.RawData) => {
      try {
        this.handleMessage(data.toString());
      } catch {
        // Never crash the manager on a bad message
      }
    });

    // T23 — Reconnect with exponential backoff on disconnect
    this.ws.on('close', (code, reason) => {
      console.warn(`[WSManager] Disconnected: ${code} ${reason.toString()}`);
      if (!this.isShuttingDown) this.scheduleReconnect();
    });

    this.ws.on('error', (err) => {
      console.error('[WSManager] WebSocket error:', err.message);
      // 'close' will fire after 'error' — reconnect handled there
    });
  }

  // ─── Message handling (T19) ───────────────────────────────────────────────

  private handleMessage(raw: string): void {
    const msg = JSON.parse(raw) as Record<string, unknown>;

    // Respond to Finnhub keepalive pings
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
    // Finnhub trade shape: { s: symbol, p: price, v: volume, t: timestamp_ms }
    const result = StockTickSchema.safeParse({
      symbol: trade['s'],
      price: trade['p'],
      volume: trade['v'],
      timestamp: trade['t'],
    });

    if (!result.success) return;

    const tick = result.data;

    // Throttle broadcasts — drop if last broadcast for this symbol was too recent
    const last = this.lastBroadcastAt.get(tick.symbol) ?? 0;
    if (Date.now() - last < BROADCAST_THROTTLE_MS) return;
    this.lastBroadcastAt.set(tick.symbol, Date.now());

    // T20 — Broadcast to Supabase Realtime (fire and forget)
    void this.broadcastTick(tick);
  }

  // ─── Supabase Broadcast (T20) ─────────────────────────────────────────────

  /**
   * Broadcasts a validated tick to the per-symbol Supabase Realtime channel.
   *
   * KEY INSIGHT: Calling .send() BEFORE .subscribe() uses Supabase's HTTP
   * REST broadcast API — no persistent server-side channel needed. [supabase.com/docs]
   */
  private async broadcastTick(tick: StockTick): Promise<void> {
    try {
      const supabase = getAdminClient();
      const channel = supabase.channel(`ticks:${tick.symbol}`);

      // Sending before subscribe → Supabase uses HTTP REST broadcast
      await channel.send({
        type: 'broadcast',
        event: 'tick',
        payload: tick,
      });
    } catch (err) {
      console.warn(`[WSManager] Broadcast failed for ${tick.symbol}:`, err);
    }
  }

  // ─── Symbol subscription management (T19) ────────────────────────────────

  addSymbol(symbol: string): void {
    const upper = symbol.toUpperCase();
    if (this.subscribedSymbols.has(upper)) return;

    this.subscribedSymbols.add(upper);

    // Only send subscribe message if WS is already open
    // On reconnect, all symbols are resubscribed in the 'open' handler
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

  // ─── Sync symbols from DB (called on startup + periodically) ─────────────

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
        (data ?? []).map((row: { symbol: string }) => row.symbol.toUpperCase()),
      );

      // Subscribe to symbols added since last sync
      for (const symbol of dbSymbols) {
        if (!this.subscribedSymbols.has(symbol)) {
          this.addSymbol(symbol);
        }
      }

      // Unsubscribe from symbols no longer in any watchlist
      for (const symbol of this.subscribedSymbols) {
        if (!dbSymbols.has(symbol)) {
          this.removeSymbol(symbol);
        }
      }

      console.log(`[WSManager] Synced — tracking ${this.subscribedSymbols.size} symbols`);
    } catch (err) {
      console.warn('[WSManager] syncSymbolsFromDatabase error:', err);
    }
  }

  // ─── Reconnect with exponential backoff (T23) ─────────────────────────────

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('[WSManager] Max reconnect attempts reached. Giving up.');
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

  // ─── Graceful shutdown ────────────────────────────────────────────────────

  shutdown(): void {
    this.isShuttingDown = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close(1000, 'Server shutdown');
    console.log('[WSManager] Shut down.');
  }

  // ─── Status ───────────────────────────────────────────────────────────────

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