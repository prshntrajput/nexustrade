import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';

// Phase 6 registers functions here — for now just mount the endpoint
// so Inngest can discover the app and receive events
const handler = serve({
  client: inngest,
  functions: [], // Phase 6 fills this
});

export const GET = handler.GET;
export const POST = handler.POST;
export const PUT = handler.PUT;