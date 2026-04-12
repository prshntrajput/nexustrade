import type { NextRequest } from 'next/server';
import { compose, withAuth } from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import { createSuccessResponse } from '@/lib/middleware/utils';

async function statusHandler(
  _request: NextRequest,
  _ctx: RequestContext,
): Promise<Response> {
  try {
    const { WebSocketManager } = await import('@/lib/services/websocket.manager');
    const status = WebSocketManager.getInstance().getStatus();
    return createSuccessResponse(status);
  } catch {
    return createSuccessResponse({
      connectionState: 'UNAVAILABLE',
      isConnected: false,
      symbolCount: 0,
      symbols: [],
      reconnectAttempts: 0,
    });
  }
}

export const GET = compose(withAuth, statusHandler);