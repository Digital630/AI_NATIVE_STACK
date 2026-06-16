-- AgriSMES Polar Subscription Infrastructure
-- Run via: supabase db push OR paste into Supabase SQL Editor

CREATE TABLE IF NOT EXISTS agrismes_subscriptions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email                 TEXT NOT NULL,
  polar_customer_id     TEXT,
  polar_subscription_id TEXT UNIQUE,
  polar_product_id      TEXT,
  polar_order_id        TEXT,
  plan                  TEXT NOT NULL DEFAULT 'pro',
  billing_cycle         TEXT NOT NULL DEFAULT 'monthly',
  status                TEXT NOT NULL DEFAULT 'pending',
  started_at            TIMESTAMPTZ,
  current_period_end    TIMESTAMPTZ,
  canceled_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  amount_usd            NUMERIC(10,2),
  currency              TEXT DEFAULT 'USD',
  cancel_at_period_end  BOOLEAN DEFAULT FALSE,
  metadata              JSONB
);

CREATE TABLE IF NOT EXISTS agrismes_polar_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload    JSONB NOT NULL,
  processed  BOOLEAN DEFAULT FALSE,
  error      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agrismes_subs_email    ON agrismes_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_agrismes_subs_polar_id ON agrismes_subscriptions(polar_subscription_id);
CREATE INDEX IF NOT EXISTS idx_agrismes_subs_status   ON agrismes_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_polar_events_type      ON agrismes_polar_events(event_type);

ALTER TABLE agrismes_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agrismes_polar_events  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_subscription" ON agrismes_subscriptions;
CREATE POLICY "users_own_subscription" ON agrismes_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR auth.email() = email);

DROP POLICY IF EXISTS "service_role_polar_events" ON agrismes_polar_events;
CREATE POLICY "service_role_polar_events" ON agrismes_polar_events
  FOR ALL USING (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION agrismes_is_pro(p_email TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM agrismes_subscriptions
    WHERE email = p_email AND status = 'active'
      AND (current_period_end IS NULL OR current_period_end > NOW())
  );
$$;

CREATE OR REPLACE FUNCTION update_agrismes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_agrismes_subs_updated ON agrismes_subscriptions;
CREATE TRIGGER trg_agrismes_subs_updated
  BEFORE UPDATE ON agrismes_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_agrismes_updated_at();
