import type { NextRequest } from 'next/server';
import { compose, withAuth, withRateLimit } from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/middleware/utils';
import { getWatchlistRepository } from '@/lib/repositories/watchlist.repository';
import { getAdminClient } from '@/lib/supabase/admin';
import { DatabaseError, NotFoundError } from '@/lib/errors';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  return compose(
    withAuth,
    withRateLimit({ service: 'database', rpm: 120 }),
    async (_req: NextRequest, ctx: RequestContext): Promise<Response> => {
      try {
        const repo = getWatchlistRepository();
        const item = await repo.findById(id, ctx.user!.id);
        if (!item) throw new NotFoundError('Watchlist item');

        await repo.delete(id, ctx.user!.id);

        const { count } = await getAdminClient()
          .from('watchlist')
          .select('id', { count: 'exact', head: true })
          .eq('symbol', item.symbol);

        if ((count ?? 0) === 0) {
          try {
            const { WebSocketManager } = await import(
              '@/lib/services/websocket.manager'
            );
            WebSocketManager.getInstance().removeSymbol(item.symbol);
          } catch {
            // Non-fatal
          }
        }

        return createSuccessResponse({ deleted: true, id, symbol: item.symbol });
      } catch (err) {
        if (err instanceof NotFoundError) {
          return createErrorResponse('Watchlist item not found', 404);
        }
        if (err instanceof DatabaseError) {
          return createErrorResponse('Failed to delete item', 500);
        }
        return createErrorResponse('Unexpected server error', 500);
      }
    },
  )(request);
}