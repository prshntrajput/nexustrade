import { Inngest } from 'inngest';

/**
 * Inngest client singleton — shared across the entire app.
 * Functions are registered in Phase 6 (/inngest/functions/).
 * Events are sent from Phase 5 (alert evaluator).
 */
export const inngest = new Inngest({
  id: 'nexustrade',
  name: 'NexusTrade',
});