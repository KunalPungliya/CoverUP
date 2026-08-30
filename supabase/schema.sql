-- ============================================
-- CoverUP - CLEAN RESET (drop everything first)
-- ============================================

-- Drop tables (order matters due to foreign keys)
drop table if exists recovery_actions cascade;
drop table if exists recovery_batches cascade;
drop table if exists payment_attempts cascade;
drop table if exists subscriptions cascade;
drop table if exists customers cascade;

-- Drop enums
drop type if exists subscription_status cascade;
drop type if exists payment_status cascade;
drop type if exists failure_reason cascade;
drop type if exists action_type cascade;
drop type if exists action_outcome cascade;
drop type if exists batch_status cascade;
drop type if exists billing_cycle cascade;

-- Drop trigger function
drop function if exists update_updated_at cascade;

-- ============================================
-- Now recreate everything fresh
-- ============================================

create extension if not exists "pgcrypto";

create type subscription_status as enum (
  'active', 'past_due', 'failed', 'recovered', 'cancelled', 'unrecoverable'
);

create type payment_status as enum ('success', 'failed');

create type failure_reason as enum (
  'insufficient_funds',
  'card_expired',
  'bank_declined',
  'network_error',
  'authentication_required',
  'fraud_suspected',
  'account_closed'
);

create type action_type as enum (
  'retry_payment',
  'send_email_reminder',
  'send_sms_nudge',
  'request_payment_update',
  'escalate',
  'mark_unrecoverable'
);

create type action_outcome as enum (
  'success', 'pending', 'failed', 'skipped'
);

create type batch_status as enum ('running', 'completed');

create type billing_cycle as enum ('monthly', 'quarterly', 'annual');

-- Customers
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);

-- Subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  plan_name text not null,
  amount integer not null,
  currency text not null default 'INR',
  billing_cycle billing_cycle not null default 'monthly',
  status subscription_status not null default 'active',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '30 days'),
  payment_method jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_customer on subscriptions(customer_id);
create index idx_subscriptions_status on subscriptions(status);

-- Payment Attempts
create table payment_attempts (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  amount integer not null,
  status payment_status not null default 'failed',
  failure_reason failure_reason,
  failure_description text,
  gateway_response jsonb default '{}',
  attempted_at timestamptz not null default now()
);

create index idx_payment_attempts_subscription on payment_attempts(subscription_id);
create index idx_payment_attempts_status on payment_attempts(status);

-- Recovery Batches
create table recovery_batches (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  total_at_risk integer not null default 0,
  total_recovered integer not null default 0,
  total_unresolved integer not null default 0,
  total_amount_at_risk integer not null default 0,
  total_amount_recovered integer not null default 0,
  status batch_status not null default 'running'
);

-- Recovery Actions (THE AUDIT TRAIL)
create table recovery_actions (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references subscriptions(id) on delete cascade,
  batch_id uuid references recovery_batches(id) on delete set null,
  action_type action_type not null,
  action_detail jsonb default '{}',
  ai_reasoning text,
  ai_confidence real default 0.0,
  outcome action_outcome not null default 'pending',
  amount_recovered integer default 0,
  retry_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_recovery_actions_subscription on recovery_actions(subscription_id);
create index idx_recovery_actions_batch on recovery_actions(batch_id);
create index idx_recovery_actions_outcome on recovery_actions(outcome);
create index idx_recovery_actions_created on recovery_actions(created_at);

-- RLS (permissive for hackathon)
alter table customers enable row level security;
alter table subscriptions enable row level security;
alter table payment_attempts enable row level security;
alter table recovery_batches enable row level security;
alter table recovery_actions enable row level security;

create policy "Allow all on customers" on customers for all using (true) with check (true);
create policy "Allow all on subscriptions" on subscriptions for all using (true) with check (true);
create policy "Allow all on payment_attempts" on payment_attempts for all using (true) with check (true);
create policy "Allow all on recovery_batches" on recovery_batches for all using (true) with check (true);
create policy "Allow all on recovery_actions" on recovery_actions for all using (true) with check (true);

-- Auto-update trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute function update_updated_at();
