import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { analyzeStock } from '@/inngest/functions';

// Allow long-running Inngest workflows (Gemini + multi-step can take ~30s)
export const maxDuration = 300;

const handler = serve({
  client: inngest,
  functions: [analyzeStock],
});

export const GET = handler.GET;
export const POST = handler.POST;
export const PUT = handler.PUT;