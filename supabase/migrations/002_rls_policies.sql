-- ============================================================
-- NexusTrade: Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE watchlist          ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_reports   ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits    ENABLE ROW LEVEL SECURITY;

-- Watchlist: users own their own rows
CREATE POLICY "watchlist_select_own" ON watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "watchlist_insert_own" ON watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "watchlist_update_own" ON watchlist
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "watchlist_delete_own" ON watchlist
  FOR DELETE USING (auth.uid() = user_id);

-- Alerts: users own their own rows
CREATE POLICY "alerts_select_own" ON alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "alerts_insert_own" ON alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "alerts_update_own" ON alerts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "alerts_delete_own" ON alerts
  FOR DELETE USING (auth.uid() = user_id);

-- Analysis Reports: users own their own rows
CREATE POLICY "reports_select_own" ON analysis_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "reports_insert_own" ON analysis_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reports_delete_own" ON analysis_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Rate limits: service role only (no user-level access needed)
CREATE POLICY "rate_limits_service_only" ON api_rate_limits
  FOR ALL USING (false);