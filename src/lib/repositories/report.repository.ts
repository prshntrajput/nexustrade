import { getAdminClient } from '@/lib/supabase/admin';
import { DatabaseError } from '@/lib/errors';
import type { Report } from '@/types';

export interface ReportFilters {
  symbol?: string;
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  trigger?: 'alert' | 'manual' | 'scheduled';
  limit?: number;
  offset?: number;
}

interface CreateReportPayload {
  symbol: string;
  alertId: string | null;
  trigger: 'alert' | 'manual' | 'scheduled';
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  keyRisks: string[];
  keyOpportunities: string[];
  technicalOutlook: string;
  indicators: Record<string, number>;
}

function mapRow(row: Record<string, unknown>): Report {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    symbol: row.symbol as string,
    alertId: (row.alert_id as string | null) ?? null,
    trigger: row.trigger as Report['trigger'],
    summary: row.summary as string,
    sentiment: row.sentiment as Report['sentiment'],
    keyRisks: (row.key_risks as string[]) ?? [],
    keyOpportunities: (row.key_opportunities as string[]) ?? [],
    technicalOutlook: row.technical_outlook as string,
    indicators: row.indicators as Report['indicators'],
    createdAt: row.created_at as string,
  };
}

export class ReportRepository {
  async findByUserId(
    userId: string,
    filters: ReportFilters = {},
  ): Promise<Report[]> {
    const supabase = getAdminClient();

    let query = supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(filters.limit ?? 20);

    if (filters.symbol) query = query.eq('symbol', filters.symbol);
    if (filters.sentiment) query = query.eq('sentiment', filters.sentiment);
    if (filters.trigger) query = query.eq('trigger', filters.trigger);
    if (filters.offset) query = query.range(filters.offset, (filters.offset + (filters.limit ?? 20)) - 1);

    const { data, error } = await query;
    if (error) throw new DatabaseError(error.message);

    return (data ?? []).map(mapRow);
  }

  async create(userId: string, payload: CreateReportPayload): Promise<Report> {
    const supabase = getAdminClient();

    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        symbol: payload.symbol,
        alert_id: payload.alertId,
        trigger: payload.trigger,
        summary: payload.summary,
        sentiment: payload.sentiment,
        key_risks: payload.keyRisks,
        key_opportunities: payload.keyOpportunities,
        technical_outlook: payload.technicalOutlook,
        indicators: payload.indicators,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message);
    return mapRow(data as Record<string, unknown>);
  }

  async deleteById(userId: string, reportId: string): Promise<void> {
    const supabase = getAdminClient();
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', userId);
    if (error) throw new DatabaseError(error.message);
  }
}

let _repo: ReportRepository | null = null;
export function getReportRepository(): ReportRepository {
  if (!_repo) _repo = new ReportRepository();
  return _repo;
}