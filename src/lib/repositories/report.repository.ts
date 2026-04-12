import { getAdminClient } from '@/lib/supabase/admin';
import { DatabaseError, NotFoundError } from '@/lib/errors';
import type { Report, Indicators } from '@/types';

// Raw DB row shape (snake_case)
interface ReportRow {
  id: string;
  user_id: string;
  symbol: string;
  alert_id: string | null;
  trigger: 'alert' | 'manual' | 'scheduled';
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  key_risks: string[];
  key_opportunities: string[];
  technical_outlook: string;
  indicators: Indicators;
  created_at: string;
}

interface CreateReportData {
  symbol: string;
  alertId: string | null;
  trigger: 'alert' | 'manual' | 'scheduled';
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  keyRisks: string[];
  keyOpportunities: string[];
  technicalOutlook: string;
  indicators: Indicators;
}

function mapRow(row: ReportRow): Report {
  return {
    id: row.id,
    userId: row.user_id,
    symbol: row.symbol.toUpperCase(),
    alertId: row.alert_id,
    trigger: row.trigger,
    summary: row.summary,
    sentiment: row.sentiment,
    keyRisks: row.key_risks,
    keyOpportunities: row.key_opportunities,
    technicalOutlook: row.technical_outlook,
    indicators: row.indicators,
    createdAt: row.created_at,
  };
}

const SELECT_FIELDS = `
  id, user_id, symbol, alert_id, trigger, summary, sentiment,
  key_risks, key_opportunities, technical_outlook, indicators, created_at
`;

export class SupabaseReportRepository {
  private get db() {
    return getAdminClient();
  }

  async findByUserId(userId: string, limit = 50): Promise<Report[]> {
    const { data, error } = await this.db
      .from('reports')
      .select(SELECT_FIELDS)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new DatabaseError('Failed to fetch reports', error);
    return (data ?? []).map((row) => mapRow(row as ReportRow));
  }

  async findById(id: string, userId: string): Promise<Report | null> {
    const { data, error } = await this.db
      .from('reports')
      .select(SELECT_FIELDS)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error?.code === 'PGRST116') return null;
    if (error) throw new DatabaseError('Failed to fetch report', error);
    return data ? mapRow(data as ReportRow) : null;
  }

  async create(userId: string, data: CreateReportData): Promise<Report> {
    const { data: row, error } = await this.db
      .from('reports')
      .insert({
        user_id: userId,
        symbol: data.symbol.toUpperCase(),
        alert_id: data.alertId ?? null,
        trigger: data.trigger,
        summary: data.summary,
        sentiment: data.sentiment,
        key_risks: data.keyRisks,
        key_opportunities: data.keyOpportunities,
        technical_outlook: data.technicalOutlook,
        indicators: data.indicators,
      })
      .select(SELECT_FIELDS)
      .single();

    if (error) throw new DatabaseError('Failed to save report', error);
    return mapRow(row as ReportRow);
  }

  async delete(id: string, userId: string): Promise<void> {
    const { error, count } = await this.db
      .from('reports')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new DatabaseError('Failed to delete report', error);
    if ((count ?? 0) === 0) throw new NotFoundError('Report');
  }
}

let _reportRepo: SupabaseReportRepository | null = null;

export function getReportRepository(): SupabaseReportRepository {
  if (!_reportRepo) _reportRepo = new SupabaseReportRepository();
  return _reportRepo;
}