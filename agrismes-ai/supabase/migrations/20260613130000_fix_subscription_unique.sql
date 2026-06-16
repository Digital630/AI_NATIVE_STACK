-- ════════════════════════════════════════════════════════════════
-- AgriSMES Subscription Table Fix
-- Run this in Supabase SQL Editor (blwahyqkwqvffdqxzuzn)
-- ════════════════════════════════════════════════════════════════

-- 1. Add UNIQUE constraint on email (required for ON CONFLICT upsert)
ALTER TABLE agrismes_subscriptions 
  ADD CONSTRAINT IF NOT EXISTS agrismes_subscriptions_email_unique UNIQUE (email);

-- 2. Insert zachzh024@gmail.com as active Pro subscriber
-- (Paid June 13 2026, webhooks failed before this was fixed)
INSERT INTO agrismes_subscriptions (
  email, polar_product_id, plan, billing_cycle, status,
  started_at, current_period_end, amount_usd, currency,
  cancel_at_period_end, metadata
) VALUES (
  'zachzh024@gmail.com',
  'e6ede3ea-8ac6-44cf-a057-d4abd2a965a8',
  'pro', 'monthly', 'active',
  NOW(), NOW() + INTERVAL '30 days',
  9.00, 'USD', false,
  '{"source":"manual_reconciliation","invoice":"AGRISMES-UNRJYJSDVM-0001","paid":"2026-06-13"}'
)
ON CONFLICT (email) DO UPDATE SET
  status = 'active',
  plan = 'pro',
  current_period_end = NOW() + INTERVAL '30 days',
  updated_at = NOW();

-- 3. Verify
SELECT id, email, plan, status, started_at, current_period_end 
FROM agrismes_subscriptions 
WHERE email = 'zachzh024@gmail.com';
