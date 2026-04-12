import { getAdminClient } from '@/lib/supabase/admin';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import type { Alert, AlertWithSymbol } from '@/types';

// Supabase returns joined relations as arrays even with !inner
interface AlertRow {
  id: string;
  watchlist_id: string;
  user_id: string;
  condition_type: Alert['conditionType'];
  threshold: number | null;
  multiplier: number | null;
  is_active: boolean;
  created_at: string;
  watchlist: { symbol: string }[]; // ← was { symbol: string }, must be array
}

function mapRow(row: AlertRow): AlertWithSymbol {
  // !inner guarantees at least one row — but we guard with fallback
  const symbol = row.watchlist[0]?.symbol ?? '';
  return {
    id: row.id,
    watchlistId: row.watchlist_id,
    userId: row.user_id,
    symbol: symbol.toUpperCase(),
    conditionType: row.condition_type,
    threshold: row.threshold,
    multiplier: row.multiplier,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

const SELECT_FIELDS = `
  id,
  watchlist_id,
  user_id,
  condition_type,
  threshold,
  multiplier,
  is_active,
  created_at,
  watchlist!inner ( symbol )
`;

interface CreateAlertData {
  watchlistId: string;
  conditionType: Alert['conditionType'];
  threshold?: number | null;
  multiplier?: number | null;
}

export class SupabaseAlertRepository {
  private get db() {
    return getAdminClient();
  }

  async findByUserId(userId: string): Promise<AlertWithSymbol[]> {
    const { data, error } = await this.db
      .from('alerts')
      .select(SELECT_FIELDS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new DatabaseError('Failed to fetch alerts', error);
    return (data ?? []).map((row) => mapRow(row as unknown as AlertRow));
  }

  async findById(id: string, userId: string): Promise<AlertWithSymbol | null> {
    const { data, error } = await this.db
      .from('alerts')
      .select(SELECT_FIELDS)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error?.code === 'PGRST116') return null;
    if (error) throw new DatabaseError('Failed to fetch alert', error);
    return data ? mapRow(data as unknown as AlertRow) : null;
  }

  async create(userId: string, data: CreateAlertData): Promise<AlertWithSymbol> {
    const { data: row, error } = await this.db
      .from('alerts')
      .insert({
        user_id: userId,
        watchlist_id: data.watchlistId,
        condition_type: data.conditionType,
        threshold: data.threshold ?? null,
        multiplier: data.multiplier ?? null,
        is_active: true,
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) throw new DatabaseError('Failed to create alert', error);
    return mapRow(row as unknown as AlertRow);
  }

  async updateActive(
    id: string,
    userId: string,
    isActive: boolean,
  ): Promise<AlertWithSymbol> {
    const { data: row, error } = await this.db
      .from('alerts')
      .update({ is_active: isActive })
      .eq('id', id)
      .eq('user_id', userId)
      .select(SELECT_FIELDS)
      .single();

    if (error?.code === 'PGRST116') throw new NotFoundError('Alert');
    if (error) throw new DatabaseError('Failed to update alert', error);
    return mapRow(row as unknown as AlertRow);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error, count } = await this.db
      .from('alerts')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new DatabaseError('Failed to delete alert', error);
    if ((count ?? 0) === 0) throw new NotFoundError('Alert');
  }
}

let _alertRepo: SupabaseAlertRepository | null = null;

export function getAlertRepository(): SupabaseAlertRepository {
  if (!_alertRepo) _alertRepo = new SupabaseAlertRepository();
  return _alertRepo;
}