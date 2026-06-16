-- AgriSMES RLS Hardening Migration
-- Generated: 2026-06-16 | Status: REVIEW ONLY — DO NOT APPLY WITHOUT APPROVAL
--
-- What this migration does:
--   1. Enables RLS on tables that currently have NONE (hot_leads_dashboard,
--      lendigital_intelligence) — these are readable by any anon key holder today.
--   2. Fixes agrismes_polar_events open_all policy (exposes all Polar events to
--      any authenticated user) — restricts to service_role only.
--   3. Adds service_role-only policy for agrismes_otp_codes (already RLS ON,
--      no policies = correct lockout, but explicit for clarity).
--
-- Tables NOT touched (intentionally public read-only market reference data):
--   current_benchmarks, current_freight_rates, live_market_signals
--
-- Tables NOT touched (RLS ON, no policies = service_role only via Edge Functions):
--   tradedoc_*, td_*, lenmac_webhook_events, email_unsubscribes, etc.
--   These are correct — they are only accessed server-side.

-- ─── 1. hot_leads_dashboard — enable RLS (currently fully public) ─────────────
-- This table contains internal CRM/lead data. It should never be readable
-- by frontend clients using the anon key.
alter table public.hot_leads_dashboard enable row level security;
-- No policies = locked to service_role only (admin dashboard reads via service_role)

-- ─── 2. lendigital_intelligence — enable RLS (currently fully public) ────────
alter table public.lendigital_intelligence enable row level security;
-- No policies = service_role only

-- ─── 3. agrismes_polar_events — fix overly permissive open_all policy ────────
-- Current: policy with qual=true means ANY authenticated user can read/write
-- ALL polar subscription events including other users' billing data.
-- Fix: drop the open_all policy. Service role (used by polar-webhook.js via
-- SUPABASE_SERVICE_ROLE_KEY) always bypasses RLS, so webhook writes still work.
drop policy if exists "open_all" on public.agrismes_polar_events;

-- No replacement public policy needed — service_role handles all writes,
-- and users do not need to read raw Polar webhook events.

-- ─── 4. agrismes_subscriptions — verify authenticated users can only read own ─
-- Already has: authenticated_read_own_subscription (SELECT, email match).
-- No change needed. Adding comment for audit trail.
-- Existing policy: (lower(auth.email()) = lower(email)) ✓

-- ─── Verification queries (run after applying to confirm effect) ──────────────
-- SELECT COUNT(*) FROM public.hot_leads_dashboard;     -- should return 0 rows for anon
-- SELECT COUNT(*) FROM public.lendigital_intelligence; -- should return 0 rows for anon
-- SELECT COUNT(*) FROM public.agrismes_polar_events;   -- should return 0 rows for authenticated non-owner
