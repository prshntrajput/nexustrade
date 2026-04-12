/**
 * Next.js instrumentation hook — runs once when the server process starts.
 * Only runs in Node.js runtime (not Edge), so it's safe to use WebSocket here.
 *
 * NOTE: On Vercel Serverless, each function invocation creates a new process.
 * This manager is fully persistent on local dev and Node.js servers (Render/Railway).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Starting WebSocket Manager...');

    try {
      // Dynamic import — ensures ws module loads only in Node.js runtime
      const { WebSocketManager } = await import(
        '@/lib/services/websocket.manager'
      );

      const manager = WebSocketManager.getInstance();

      // Connect to Finnhub WebSocket
      manager.connect();

      // Load all existing watchlist symbols from the database
      await manager.syncSymbolsFromDatabase();

      // Re-sync every 5 minutes to pick up watchlist changes
      // (individual add/remove also triggers sync via route handlers)
      const syncInterval = setInterval(
        () => void manager.syncSymbolsFromDatabase(),
        5 * 60 * 1_000,
      );

      // Graceful shutdown
      process.on('SIGTERM', () => {
        clearInterval(syncInterval);
        manager.shutdown();
      });
    } catch (err) {
      console.error('[Instrumentation] Failed to start WebSocket Manager:', err);
      // Non-fatal — app still works without real-time; REST quotes still available
    }
  }
}