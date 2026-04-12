import type { NextRequest } from 'next/server';
import {
  compose,
  withAuth,
  withRateLimit,
  withValidation,
} from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware/utils';
import { inngest } from '@/inngest/client';
import { AnalyzeRequestSchema } from '@/lib/schemas/report.schema';
import type { AnalyzeRequest } from '@/types';

async function analyzeHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const { symbol } = ctx.validatedData as AnalyzeRequest;

  try {
    // Fire the same event the alert evaluator fires — Inngest handles it async
    await inngest.send({
      name: 'stock/alert.fired',
      data: {
        userId: ctx.user!.id,
        symbol: symbol.toUpperCase(),
        alertId: undefined, // no associated alert for manual triggers
        trigger: 'manual' as const,
        conditionType: 'manual',
        firedAt: Date.now(),
      },
    });

    return createSuccessResponse(
      {
        queued: true,
        symbol: symbol.toUpperCase(),
        message: 'Analysis started — check back in ~15 seconds',
      },
      202, // Accepted — processing is async
    );
  } catch (err) {
    console.error('[POST /reports/analyze]', err);
    return createErrorResponse('Failed to queue analysis', 500);
  }
}

// Rate limit strictly — each analysis costs a Gemini API call
export async function POST(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'gemini', rpm: 5 }),
    withValidation(AnalyzeRequestSchema),
    analyzeHandler,
  )(request);
}