import type { NextRequest } from 'next/server';
import { compose, withAuth } from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/middleware/utils';

// POST /api/ws/sync — manually trigger a DB → WS symbol sync
// Called after adding/removing from watchlist for instant sync
async function syncHandler(
  _request: NextRequest,
  _ctx: RequestContext,
): Promise<Response> {
  try {
    const { WebSocketManager } = await import('@/lib/services/websocket.manager');
    const manager = WebSocketManager.getInstance();
    await manager.syncSymbolsFromDatabase();
    return createSuccessResponse({ synced: true, ...manager.getStatus() });
  } catch (err) {
    return createErrorResponse(
      'WebSocket sync failed',
      500,
      err instanceof Error ? err.message : undefined,
    );
  }
}

export const POST = compose(withAuth, syncHandler);