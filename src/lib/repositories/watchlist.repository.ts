import { getAdminClient } from '@/lib/supabase/admin';
import { DatabaseError, NotFoundError, ConflictError } from '@/lib/errors';
import type { WatchlistItem, CreateWatchlistItem } from '@/types';
import type { IWatchlistRepository } from './interfaces';

// ─── DB row → TypeScript type mapper (snake_case → camelCase) ────────────────

interface WatchlistRow {
  id: string;
  user_id: string;
  symbol: string;
  added_at: string;
  notes: string | null;
}

function mapRowToItem(row: WatchlistRow): WatchlistItem {
  return {
    id: row.id,
    userId: row.user_id,
    symbol: row.symbol,
    addedAt: row.added_at,
    notes: row.notes,
  };
}

// ─── Supabase implementation ──────────────────────────────────────────────────

export class SupabaseWatchlistRepository implements IWatchlistRepository {
  // Getter pattern: admin client is lazy — only created when first used
  private get db() {
    return getAdminClient();
  }

  async findByUserId(userId: string): Promise<WatchlistItem[]> {
    const { data, error } = await this.db
      .from('watchlist')
      .select('*')
      .eq('user_id', userId)
      .order('added_at', { ascending: false });

    if (error) throw new DatabaseError('Failed to fetch watchlist', error);
    return (data ?? []).map((row) => mapRowToItem(row as WatchlistRow));
  }

  async findById(id: string, userId: string): Promise<WatchlistItem | null> {
    const { data, error } = await this.db
      .from('watchlist')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    // PGRST116 = "Row not found" — not an actual error
    if (error?.code === 'PGRST116') return null;
    if (error) throw new DatabaseError('Failed to fetch watchlist item', error);
    return data ? mapRowToItem(data as WatchlistRow) : null;
  }

  async create(userId: string, data: CreateWatchlistItem): Promise<WatchlistItem> {
    const { data: row, error } = await this.db
      .from('watchlist')
      .insert({
        user_id: userId,
        symbol: data.symbol.toUpperCase(),
        notes: data.notes ?? null,
      })
      .select()
      .single();

    // 23505 = PostgreSQL unique_violation
    if (error?.code === '23505') {
      throw new ConflictError(
        `${data.symbol.toUpperCase()} is already in your watchlist`,
      );
    }
    if (error) throw new DatabaseError('Failed to add symbol to watchlist', error);
    return mapRowToItem(row as WatchlistRow);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error, count } = await this.db
      .from('watchlist')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new DatabaseError('Failed to delete watchlist item', error);
    if ((count ?? 0) === 0) throw new NotFoundError('Watchlist item');
  }

  async existsBySymbol(userId: string, symbol: string): Promise<boolean> {
    const { count, error } = await this.db
      .from('watchlist')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('symbol', symbol.toUpperCase());

    if (error) throw new DatabaseError('Failed to check symbol existence', error);
    return (count ?? 0) > 0;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let _repo: SupabaseWatchlistRepository | null = null;

export function getWatchlistRepository(): SupabaseWatchlistRepository {
  if (!_repo) _repo = new SupabaseWatchlistRepository();
  return _repo;
}