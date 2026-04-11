-- ============================================================
-- NexusTrade: Initial Schema
-- ============================================================

-- Watchlist entries
CREATE TABLE IF NOT EXISTS watchlist (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol      TEXT NOT NULL CHECK (symbol ~ '^[A-Z]{1,10}$'),
  added_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes       TEXT,
  UNIQUE (user_id, symbol)
);

-- Alert configurations
CREATE TABLE IF NOT EXISTS alerts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id    UUID NOT NULL REFERENCES watchlist(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condition_type  TEXT NOT NULL CHECK (
    condition_type IN ('PRICE_ABOVE','PRICE_BELOW','RSI_ABOVE','RSI_BELOW','VOLUME_SPIKE')
  ),
  threshold       NUMERIC,
  multiplier      NUMERIC,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI-generated analysis reports
CREATE TABLE IF NOT EXISTS analysis_reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol       TEXT NOT NULL,
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('alert','manual','scheduled')),
  indicators   JSONB NOT NULL,
  news_count   INT,
  ai_summary   TEXT NOT NULL,
  sentiment    TEXT CHECK (sentiment IN ('BULLISH','BEARISH','NEUTRAL')),
  key_risks    JSONB NOT NULL DEFAULT '[]',
  key_opportunities JSONB NOT NULL DEFAULT '[]',
  technical_outlook TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rate limiting tracker (sliding window)
CREATE TABLE IF NOT EXISTS api_rate_limits (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service       TEXT NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  request_count INT NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, service, window_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_watchlist_id ON alerts(watchlist_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_symbol ON analysis_reports(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_created_at ON analysis_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup ON api_rate_limits(user_id, service, window_start);