export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Starting NexusTrade services...');

    try {
      const { WebSocketManager } = await import('@/lib/services/websocket.manager');
      const { AlertEvaluator } = await import('@/lib/alert.evaluator');

      const wsManager = WebSocketManager.getInstance();
      const alertEvaluator = AlertEvaluator.getInstance();

      wsManager.connect();

      // Load both in parallel
      await Promise.all([
        wsManager.syncSymbolsFromDatabase(),
        alertEvaluator.syncAlerts(),
      ]);

      // Re-sync every 5 minutes to catch any DB changes
      const syncInterval = setInterval(() => {
        void wsManager.syncSymbolsFromDatabase();
        void alertEvaluator.syncAlerts();
      }, 5 * 60 * 1_000);

      process.on('SIGTERM', () => {
        clearInterval(syncInterval);
        wsManager.shutdown();
      });

      console.log('[Instrumentation] ✅ All services started');
    } catch (err) {
      console.error('[Instrumentation] Startup error:', err);
    }
  }
}