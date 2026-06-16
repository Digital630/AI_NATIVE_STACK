create table if not exists public.tradedoc_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  company text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'expired')),
  plan_status text not null default 'free' check (plan_status in ('free', 'pro', 'expired')),
  plan_started_at timestamptz,
  plan_expires_at timestamptz,
  payment_reference text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tradedoc_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null,
  form_payload jsonb not null default '{}'::jsonb,
  status text not null default 'generated' check (status in ('generated', 'archived')),
  created_at timestamptz not null default now()
);

create table if not exists public.tradedoc_tradebot_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tradedoc_subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.tradedoc_profiles enable row level security;
alter table public.tradedoc_documents enable row level security;
alter table public.tradedoc_tradebot_usage enable row level security;
alter table public.tradedoc_subscription_events enable row level security;

drop policy if exists "profiles_select_own" on public.tradedoc_profiles;
create policy "profiles_select_own"
on public.tradedoc_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "documents_select_own" on public.tradedoc_documents;
create policy "documents_select_own"
on public.tradedoc_documents for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "documents_insert_own" on public.tradedoc_documents;
create policy "documents_insert_own"
on public.tradedoc_documents for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "tradebot_usage_select_own" on public.tradedoc_tradebot_usage;
create policy "tradebot_usage_select_own"
on public.tradedoc_tradebot_usage for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "tradebot_usage_insert_own" on public.tradedoc_tradebot_usage;
create policy "tradebot_usage_insert_own"
on public.tradedoc_tradebot_usage for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "subscription_events_select_own" on public.tradedoc_subscription_events;
create policy "subscription_events_select_own"
on public.tradedoc_subscription_events for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "subscription_events_insert_own" on public.tradedoc_subscription_events;
create policy "subscription_events_insert_own"
on public.tradedoc_subscription_events for insert
to authenticated
with check ((select auth.uid()) = user_id);
