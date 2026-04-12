import { getAdminClient } from '@/lib/supabase/admin';
import { inngest } from '@/inngest/client';
import type { StockTick, Alert, AlertWithSymbol } from '@/types';

// ─── T26 — OCP: AlertCondition interface ─────────────────────────────────────
// Add new conditions by implementing this interface — never modify existing classes

export interface AlertConditionInterface {
  evaluate(tick: StockTick): boolean;
  describe(): string;
}

// ─── Concrete condition classes ───────────────────────────────────────────────

export class PriceAboveCondition implements AlertConditionInterface {
  constructor(private readonly threshold: number) {}

  evaluate(tick: StockTick): boolean {
    return tick.price > this.threshold;
  }

  describe(): string {
    return `Price above $${this.threshold.toFixed(2)}`;
  }
}

export class PriceBelowCondition implements AlertConditionInterface {
  constructor(private readonly threshold: number) {}

  evaluate(tick: StockTick): boolean {
    return tick.price < this.threshold;
  }

  describe(): string {
    return `Price below $${this.threshold.toFixed(2)}`;
  }
}

export class RSIAboveCondition implements AlertConditionInterface {
  constructor(private readonly threshold: number) {}

  // RSI requires candle history — evaluated by Phase 6 Inngest workflow, not ticks
  evaluate(_tick: StockTick): boolean {
    return false;
  }

  describe(): string {
    return `RSI(14) above ${this.threshold}`;
  }
}

export class RSIBelowCondition implements AlertConditionInterface {
  constructor(private readonly threshold: number) {}

  // Deferred to Phase 6 scheduled analysis
  evaluate(_tick: StockTick): boolean {
    return false;
  }

  describe(): string {
    return `RSI(14) below ${this.threshold}`;
  }
}

export class VolumeSpikeCondition implements AlertConditionInterface {
  constructor(
    private readonly multiplier: number,
    private readonly baselineVolume: number = 0,
  ) {}

  evaluate(tick: StockTick): boolean {
    if (this.baselineVolume === 0 || !tick.volume || tick.volume === 0) return false;
    return tick.volume > this.baselineVolume * this.multiplier;
  }

  describe(): string {
    return `Volume spike ${this.multiplier}× above average`;
  }
}

// ─── LSP — Factory: all conditions are interchangeable via interface ──────────

export function createConditionFromAlert(alert: Alert): AlertConditionInterface {
  switch (alert.conditionType) {
    case 'PRICE_ABOVE':
      if (alert.threshold === null) throw new Error('PRICE_ABOVE missing threshold');
      return new PriceAboveCondition(Number(alert.threshold));

    case 'PRICE_BELOW':
      if (alert.threshold === null) throw new Error('PRICE_BELOW missing threshold');
      return new PriceBelowCondition(Number(alert.threshold));

    case 'RSI_ABOVE':
      if (alert.threshold === null) throw new Error('RSI_ABOVE missing threshold');
      return new RSIAboveCondition(Number(alert.threshold));

    case 'RSI_BELOW':
      if (alert.threshold === null) throw new Error('RSI_BELOW missing threshold');
      return new RSIBelowCondition(Number(alert.threshold));

    case 'VOLUME_SPIKE':
      if (alert.multiplier === null) throw new Error('VOLUME_SPIKE missing multiplier');
      return new VolumeSpikeCondition(Number(alert.multiplier));

    default:
      throw new Error(`Unknown condition type: ${alert.conditionType as string}`);
  }
}

// ─── AlertEvaluator Singleton ─────────────────────────────────────────────────

interface CachedAlert {
  alert: AlertWithSymbol;
  condition: AlertConditionInterface;
}

// Prevent the same alert firing more than once per 5 minutes
const COOLDOWN_MS = 5 * 60 * 1_000;

export class AlertEvaluator {
  private static _instance: AlertEvaluator | null = null;

  // symbol → list of { alert, condition } pairs
  private alertCache = new Map<string, CachedAlert[]>();

  // alertId → last fired timestamp
  private cooldowns = new Map<string, number>();

  private constructor() {}

  static getInstance(): AlertEvaluator {
    if (!AlertEvaluator._instance) {
      AlertEvaluator._instance = new AlertEvaluator();
    }
    return AlertEvaluator._instance;
  }

  // ─── T27 — Called by WebSocketManager on every validated tick ─────────────

  async evaluate(tick: StockTick): Promise<void> {
    const cached = this.alertCache.get(tick.symbol.toUpperCase()) ?? [];

    for (const { alert, condition } of cached) {
      if (!alert.isActive) continue;

      // Cooldown: prevent duplicate fires within 5 minutes
      const lastFired = this.cooldowns.get(alert.id) ?? 0;
      if (Date.now() - lastFired < COOLDOWN_MS) continue;

      const triggered = condition.evaluate(tick);
      if (!triggered) continue;

      // Set cooldown before async work to prevent race
      this.cooldowns.set(alert.id, Date.now());

      // T28 — Fire Inngest event (fire and forget — never block the tick loop)
      void this.fireAlert(tick, alert);
    }
  }

  // ─── T28 — Send Inngest event ─────────────────────────────────────────────

  private async fireAlert(tick: StockTick, alert: AlertWithSymbol): Promise<void> {
    try {
      await inngest.send({
        name: 'stock/alert.fired',
        data: {
          userId: alert.userId,
          symbol: alert.symbol,
          alertId: alert.id,
          trigger: 'alert' as const,
          conditionType: alert.conditionType,
          firedAt: tick.timestamp,
        },
      });

      console.log(
        `[AlertEvaluator] 🔔 Fired: ${alert.conditionType} on ${alert.symbol} ` +
          `(id: ${alert.id})`,
      );
    } catch (err) {
      // Non-fatal — Inngest may not be running locally without the dev server
      console.warn(`[AlertEvaluator] Inngest send failed:`, err);
    }
  }

  // ─── Rebuild cache from DB ────────────────────────────────────────────────

  async syncAlerts(): Promise<void> {
    try {
      const { data, error } = await getAdminClient()
        .from('alerts')
        .select(
          `
          id,
          watchlist_id,
          user_id,
          condition_type,
          threshold,
          multiplier,
          is_active,
          created_at,
          watchlist!inner ( symbol )
        `,
        )
        .eq('is_active', true);

      if (error) {
        console.warn('[AlertEvaluator] DB sync failed:', error.message);
        return;
      }

      this.alertCache.clear();

      for (const row of data ?? []) {
        const r = row as Record<string, unknown>;
        const wl = r['watchlist'] as { symbol: string };

        const alert: AlertWithSymbol = {
          id: r['id'] as string,
          watchlistId: r['watchlist_id'] as string,
          userId: r['user_id'] as string,
          symbol: wl.symbol.toUpperCase(),
          conditionType: r['condition_type'] as Alert['conditionType'],
          threshold: r['threshold'] as number | null,
          multiplier: r['multiplier'] as number | null,
          isActive: r['is_active'] as boolean,
          createdAt: r['created_at'] as string,
        };

        try {
          const condition = createConditionFromAlert(alert);
          const existing = this.alertCache.get(alert.symbol) ?? [];
          existing.push({ alert, condition });
          this.alertCache.set(alert.symbol, existing);
        } catch (err) {
          console.warn(`[AlertEvaluator] Skipping invalid alert ${alert.id}:`, err);
        }
      }

      const total = [...this.alertCache.values()].reduce((s, a) => s + a.length, 0);
      console.log(`[AlertEvaluator] Synced — ${total} active alerts`);
    } catch (err) {
      console.warn('[AlertEvaluator] syncAlerts error:', err);
    }
  }
}