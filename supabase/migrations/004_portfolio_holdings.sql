-- ─── Portfolio Holdings ────────────────────────────────────────────────────────
-- One row per user per symbol. Shares and avg_buy_price are updated in-place
-- when the user re-adds a symbol (upsert by user_id, symbol).

CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol        TEXT          NOT NULL,
  shares        NUMERIC(15,6) NOT NULL CHECK (shares > 0),
  avg_buy_price NUMERIC(12,4) NOT NULL CHECK (avg_buy_price > 0),
  notes         TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Fast per-user lookups (used in every list query)
CREATE INDEX IF NOT EXISTS idx_portfolio_holdings_user_id
  ON portfolio_holdings(user_id);

-- Enforces one row per symbol per user — enables ON CONFLICT upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_holdings_user_symbol
  ON portfolio_holdings(user_id, symbol);

-- ─── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;

-- Users can only read, insert, update, and delete their own rows
CREATE POLICY "users_own_portfolio_holdings"
  ON portfolio_holdings
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Auto-update updated_at ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_portfolio_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_portfolio_holdings_updated_at
  BEFORE UPDATE ON portfolio_holdings
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_updated_at();
