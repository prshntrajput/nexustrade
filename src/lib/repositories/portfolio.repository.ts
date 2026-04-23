import { getAdminClient } from '@/lib/supabase/admin';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import type { Holding, CreateHolding, UpdateHolding } from '@/lib/schemas/portfolio.schema';

// ─── Row mapper ───────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): Holding {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    symbol: row.symbol as string,
    shares: Number(row.shares),
    avgBuyPrice: Number(row.avg_buy_price),
    notes: (row.notes as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class PortfolioRepository {
  // ── List all holdings for a user ───────────────────────────────────────────

  async findByUserId(userId: string): Promise<Holding[]> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw new DatabaseError(error.message);

    return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  }

  // ── Find single holding by id (user-scoped) ────────────────────────────────

  async findById(userId: string, id: string): Promise<Holding | null> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('portfolio_holdings')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new DatabaseError(error.message);
    }

    return data ? mapRow(data as Record<string, unknown>) : null;
  }

  // ── Upsert by symbol — create on first add, update on subsequent ───────────
  // Uses Postgres ON CONFLICT so we never get duplicate symbols per user.

  async upsert(userId: string, payload: CreateHolding): Promise<Holding> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('portfolio_holdings')
      .upsert(
        {
          user_id: userId,
          symbol: payload.symbol.toUpperCase(),
          shares: payload.shares,
          avg_buy_price: payload.avgBuyPrice,
          notes: payload.notes ?? null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,symbol',
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);

    return mapRow(data as Record<string, unknown>);
  }

  // ── Partial update ─────────────────────────────────────────────────────────

  async updateById(
    userId: string,
    id: string,
    payload: UpdateHolding,
  ): Promise<Holding> {
    const supabase = getAdminClient();

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (payload.shares !== undefined) updates.shares = payload.shares;
    if (payload.avgBuyPrice !== undefined)
      updates.avg_buy_price = payload.avgBuyPrice;
    if (payload.notes !== undefined) updates.notes = payload.notes;

    const { data, error } = await supabase
      .from('portfolio_holdings')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new NotFoundError('Holding');
      throw new DatabaseError(error.message);
    }

    return mapRow(data as Record<string, unknown>);
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  async deleteById(userId: string, id: string): Promise<void> {
    const supabase = getAdminClient();

    const { error } = await supabase
      .from('portfolio_holdings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new DatabaseError(error.message);
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _repo: PortfolioRepository | null = null;

export function getPortfolioRepository(): PortfolioRepository {
  if (!_repo) _repo = new PortfolioRepository();
  return _repo;
}
