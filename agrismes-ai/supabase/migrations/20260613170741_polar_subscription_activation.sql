create table if not exists public.agrismes_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  email text not null,
  polar_customer_id text,
  polar_subscription_id text,
  polar_order_id text,
  polar_product_id text,
  product_name text,
  plan text not null default 'pro',
  status text not null default 'pending',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists agrismes_subscriptions_polar_subscription_id_key
  on public.agrismes_subscriptions (polar_subscription_id)
  where polar_subscription_id is not null;

create index if not exists agrismes_subscriptions_user_id_idx
  on public.agrismes_subscriptions (user_id);

create index if not exists agrismes_subscriptions_email_idx
  on public.agrismes_subscriptions (lower(email));

create unique index if not exists agrismes_subscriptions_email_product_pending_key
  on public.agrismes_subscriptions (lower(email), coalesce(polar_product_id, ''))
  where polar_subscription_id is null;

create table if not exists public.polar_webhook_events (
  id uuid primary key default gen_random_uuid(),
  polar_event_id text not null unique,
  event_type text,
  processed boolean not null default false,
  payload jsonb,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists polar_webhook_events_type_created_idx
  on public.polar_webhook_events (event_type, created_at desc);

create table if not exists public.user_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free',
  updated_at timestamptz not null default now()
);

alter table public.agrismes_subscriptions enable row level security;
alter table public.polar_webhook_events enable row level security;
alter table public.user_plans enable row level security;

drop policy if exists "Users can read own agrismes subscriptions" on public.agrismes_subscriptions;
create policy "Users can read own agrismes subscriptions"
  on public.agrismes_subscriptions
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  );

drop policy if exists "Users can read own plan" on public.user_plans;
create policy "Users can read own plan"
  on public.user_plans
  for select
  to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.polar_webhook_events from anon, authenticated;
grant select on public.agrismes_subscriptions to authenticated;
grant select on public.user_plans to authenticated;

drop trigger if exists update_agrismes_subscriptions_updated_at on public.agrismes_subscriptions;
create trigger update_agrismes_subscriptions_updated_at
before update on public.agrismes_subscriptions
for each row
execute function public.update_updated_at_column();

drop trigger if exists update_user_plans_updated_at on public.user_plans;
create trigger update_user_plans_updated_at
before update on public.user_plans
for each row
execute function public.update_updated_at_column();
