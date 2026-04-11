import type { NextRequest } from 'next/server';
import { compose, withAuth, withRateLimit } from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/middleware/utils';
import { getWatchlistRepository } from '@/lib/repositories/watchlist.repository';
import { DatabaseError, NotFoundError } from '@/lib/errors';

// In Next.js 15, params is a Promise — must be awaited
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  // compose() is called inline so `id` is captured in the handler closure
  return compose(
    withAuth,
    withRateLimit({ service: 'database', rpm: 120 }),
    async (_req: NextRequest, ctx: RequestContext): Promise<Response> => {
      try {
        const repo = getWatchlistRepository();
        await repo.delete(id, ctx.user!.id);
        return createSuccessResponse({ deleted: true, id });
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