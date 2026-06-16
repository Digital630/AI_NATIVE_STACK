-- TradeDoc RLS Hardening Migration
-- Generated: 2026-06-16 | Status: REVIEW ONLY — DO NOT APPLY WITHOUT APPROVAL
--
-- Context:
--   All tradedoc_* tables currently have RLS enabled but ZERO policies.
--   This is correct for the Edge Function pattern: the tradedoc Edge Function
--   uses the service_role key, which always bypasses RLS. Frontend clients
--   (using the anon key) cannot directly read any tradedoc table — all access
--   is mediated by the Edge Function.
--
--   This migration adds policies for the TWO tables the new Supabase-native
--   auth flow may eventually access directly from the frontend:
--     - tradedoc_documents (user_id column, nullable for legacy rows)
--     - tradedoc_consignments (owner_email column — no auth.uid() available)
--     - tradedoc_subscriptions (email column — already has policy, added for completeness)
--
--   All other tradedoc_* tables remain locked (service_role only). This is
--   intentional — they contain billing data, counterparty data, and system
--   logs that must only be accessed via the server.
--
-- DO NOT APPLY until:
--   1. The frontend is confirmed to query these tables directly (not via Edge Fn)
--   2. Legacy rows without user_id are audited or backfilled
--   3. You confirm consignment owner_email matches auth.email() for all real users

-- ─── tradedoc_documents: let authenticated users read/insert their own docs ───
-- NOTE: user_id is nullable — legacy rows (user_id IS NULL) will not be visible
-- to authenticated users. This is correct behaviour.
drop policy if exists "documents_select_own" on public.tradedoc_documents;
create policy "documents_select_own"
  on public.tradedoc_documents
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "documents_insert_own" on public.tradedoc_documents;
create policy "documents_insert_own"
  on public.tradedoc_documents
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- ─── tradedoc_consignments: owner_email-based access ──────────────────────────
-- consignments use owner_email (not user_id). Only the new Supabase OTP flow
-- populates auth.email(). Old localStorage users have no Supabase session
-- and cannot match.
drop policy if exists "consignments_select_own" on public.tradedoc_consignments;
create policy "consignments_select_own"
  on public.tradedoc_consignments
  for select
  to authenticated
  using (lower(auth.email()) = lower(owner_email));

-- ─── tradedoc_subscriptions: already has authenticated_read_own_subscription ──
-- Existing policy: (lower(auth.email()) = lower(email)) for SELECT ✓
-- No change needed.

-- ─── tradedoc_users: keep locked (service_role only) ─────────────────────────
-- tradedoc_users is the legacy user record table. The Edge Function reads and
-- writes it via service_role. Frontend should read plan status via
-- tradedoc_subscriptions (above), NOT tradedoc_users.
-- No policy added — locked is correct.

-- ─── New tables (from original 20260613000000 migration, safe to create) ─────
-- These tables do not exist yet in production and are needed for the new OTP flow.
create table if not exists public.tradedoc_tradebot_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.tradedoc_tradebot_usage enable row level security;

drop policy if exists "tradebot_usage_own" on public.tradedoc_tradebot_usage;
create policy "tradebot_usage_own"
  on public.tradedoc_tradebot_usage
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ─── Verification queries (run after applying) ────────────────────────────────
-- As an authenticated user:
--   SELECT count(*) FROM tradedoc_documents;     -- should return only own rows
--   SELECT count(*) FROM tradedoc_consignments;  -- should return only own rows
--   SELECT count(*) FROM tradedoc_users;         -- should return 0 (locked)
