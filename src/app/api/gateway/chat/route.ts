import { z } from 'zod';
import { type NextRequest } from 'next/server';
import { SymbolSchema } from '@/lib/schemas/stock.schema';
import {
  compose,
  withAuth,
  withRateLimit,
  withValidation,
} from '@/lib/middleware';
import type { RequestContext } from '@/lib/middleware';
import { getFinnhubService } from '@/lib/services/finnhub.service';
import { getGeminiService } from '@/lib/services/gemini.service';
import {
  createSuccessResponse,
  createErrorResponse,
} from '@/lib/middleware/utils';

// ─── Schema ───────────────────────────────────────────────────────────────────

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2_000),
});

const ChatRequestSchema = z.object({
  symbol: SymbolSchema,
  // Full conversation history — model uses it for follow-up context
  messages: z.array(ChatMessageSchema).min(1).max(20),
});

type ChatRequest = z.infer<typeof ChatRequestSchema>;

// ─── Handler ──────────────────────────────────────────────────────────────────

async function chatHandler(
  _request: NextRequest,
  ctx: RequestContext,
): Promise<Response> {
  const { symbol, messages } = ctx.validatedData as ChatRequest;

  try {
    // Fetch live quote and recent news in parallel to build AI context
    const [quote, news] = await Promise.all([
      getFinnhubService().getQuote(symbol),
      getFinnhubService().getCompanyNews(symbol, 3),
    ]);

    const reply = await getGeminiService().chat(symbol, quote, news, messages);

    return createSuccessResponse({ message: reply });
  } catch (err) {
    console.error('[POST /chat]', err);
    return createErrorResponse(
      err instanceof Error ? err.message : 'Chat request failed',
      500,
    );
  }
}

// Rate-limited alongside report analysis — both consume Gemini quota.
// 10 RPM allows fluid conversation without burning the free-tier allowance.
export async function POST(request: NextRequest): Promise<Response> {
  return compose(
    withAuth,
    withRateLimit({ service: 'gemini', rpm: 10 }),
    withValidation(ChatRequestSchema),
    chatHandler,
  )(request);
}
