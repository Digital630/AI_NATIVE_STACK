-- Migration: 20260616000001_tradedoc_rls_hardening
-- Purpose: complete RLS coverage for all four TradeDoc tables.
--
-- Context:
--   All normal app operations go through the service-role Edge Function
--   (/functions/v1/tradedoc), which bypasses RLS entirely. These policies
--   are defence-in-depth — they close the gap if a browser client ever
--   attempts a direct table operation (e.g. a future developer mistake,
--   or an attacker with the anon key).
--
-- Safety:
--   Applying this migration has zero effect on existing user flows.
--   Reversible with DROP POLICY on each policy name below.
--
-- DO NOT apply via supabase db push without reviewing in staging first.

-- ── tradedoc_profiles ────────────────────────────────────────────────────────

-- Allow authenticated users to update only their own profile row.
-- Sensitive fields (plan, role, payment_reference) are only ever written
-- by the service-role client in the Edge Function; those writes bypass RLS.
drop policy if exists "profiles_update_own" on public.tradedoc_profiles;
create policy "profiles_update_own"
on public.tradedoc_profiles for update
to authenticated
using  ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Explicitly block deletes from any non-service-role client.
-- using(false) = no authenticated browser session may delete a profile row.
drop policy if exists "profiles_no_delete" on public.tradedoc_profiles;
create policy "profiles_no_delete"
on public.tradedoc_profiles for delete
to authenticated
using (false);

-- ── tradedoc_documents ───────────────────────────────────────────────────────

-- Updates and deletes on documents must only come from the service-role client.
drop policy if exists "documents_no_update" on public.tradedoc_documents;
create policy "documents_no_update"
on public.tradedoc_documents for update
to authenticated
using (false);

drop policy if exists "documents_no_delete" on public.tradedoc_documents;
create policy "documents_no_delete"
on public.tradedoc_documents for delete
to authenticated
using (false);

-- ── tradedoc_tradebot_usage ──────────────────────────────────────────────────

drop policy if exists "tradebot_usage_no_update" on public.tradedoc_tradebot_usage;
create policy "tradebot_usage_no_update"
on public.tradedoc_tradebot_usage for update
to authenticated
using (false);

drop policy if exists "tradebot_usage_no_delete" on public.tradedoc_tradebot_usage;
create policy "tradebot_usage_no_delete"
on public.tradedoc_tradebot_usage for delete
to authenticated
using (false);

-- ── tradedoc_subscription_events ─────────────────────────────────────────────

drop policy if exists "subscription_events_no_update" on public.tradedoc_subscription_events;
create policy "subscription_events_no_update"
on public.tradedoc_subscription_events for update
to authenticated
using (false);

drop policy if exists "subscription_events_no_delete" on public.tradedoc_subscription_events;
create policy "subscription_events_no_delete"
on public.tradedoc_subscription_events for delete
to authenticated
using (false);
