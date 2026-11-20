-- Bazaar AI: core schema (Postgres / Supabase). Money is integer paise. Mirrors src/lib/store.ts.
create extension if not exists vector;
create extension if not exists pg_trgm;

create type seller_status as enum ('pending', 'active', 'suspended');
create type product_status as enum ('live', 'draft', 'flagged', 'rejected', 'archived');
create type order_status as enum ('pending_payment','placed','accepted','packed','shipped','delivered','cancelled','refunded');
create type group_status as enum ('pending_payment','paid','failed','expired');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
  -- role lives in auth.users.raw_app_meta_data->>'role' (users cannot edit app_metadata)
);

create table vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users on delete cascade,
  name text not null,
  slug text not null unique,
  tagline text, city text,
  status seller_status not null default 'pending',
  commission_bps int not null default 1000 check (commission_bps between 0 and 5000),
  bank_last4 text, gstin text,
  razorpay_account_id text,            -- Route linked account
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors on delete cascade,
  title text not null, title_hi text,
  description text, description_hi text,
  category text not null,
  tags text[] not null default '{}',
  attributes jsonb not null default '{}',
  price_paise bigint not null check (price_paise > 0),
  mrp_paise bigint not null check (mrp_paise >= price_paise),
  stock int not null default 0 check (stock >= 0),     -- stock can never go below zero
  low_stock_threshold int not null default 5,
  status product_status not null default 'draft',
  flag_reason text, moderation_note text,
  images text[] not null default '{}',
  ai_generated boolean not null default false,
  fts tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(title_hi,'')), 'A') ||
    setweight(to_tsvector('simple', array_to_string(tags,' ')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description,'') || ' ' || coalesce(description_hi,'')), 'C')) stored,
  embedding vector(1536),               -- refreshed on publish/edit by the embedding pipeline
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_fts_idx on products using gin (fts);
create index products_embedding_idx on products using hnsw (embedding vector_cosine_ops);
create index products_vendor_idx on products (vendor_id, status);

create table order_groups (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references auth.users,
  customer_name text, phone text, address text, city text, pincode text,
  total_paise bigint not null,
  status group_status not null default 'pending_payment',
  razorpay_order_id text unique,
  source text not null default 'web',   -- web | assistant | agent
  expires_at timestamptz not null default now() + interval '10 minutes',
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references order_groups on delete cascade,
  vendor_id uuid not null references vendors,
  status order_status not null default 'pending_payment',
  gross_paise bigint not null, commission_paise bigint not null, payout_paise bigint not null,
  refunded_paise bigint not null default 0,
  settled boolean not null default false,
  created_at timestamptz not null default now(),
  check (gross_paise - commission_paise = payout_paise)
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  product_id uuid not null references products,
  title text not null, qty int not null check (qty > 0),
  unit_price_paise bigint not null, line_total_paise bigint not null,
  commission_bps int not null,            -- rate snapshotted at purchase
  commission_paise bigint not null
);

create table order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references orders on delete cascade,
  status order_status not null, note text, at timestamptz not null default now()
);

create table payments (
  id text primary key,                    -- gateway payment id: uniqueness gives idempotency
  group_id uuid not null references order_groups,
  amount_paise bigint not null, status text not null, raw jsonb,
  created_at timestamptz not null default now()
);

create table ledger_entries (
  id bigint generated always as identity primary key,
  event_id text not null,
  event_type text not null check (event_type in ('payment_captured','refund','payout')),
  account text not null,                  -- gateway_clearing | platform_commission | seller_payable:<vendor> | bank_settlement
  debit_paise bigint not null default 0 check (debit_paise >= 0),
  credit_paise bigint not null default 0 check (credit_paise >= 0),
  check ((debit_paise = 0) <> (credit_paise = 0)),
  order_id uuid references orders, vendor_id uuid references vendors,
  memo text, at timestamptz not null default now()
);
create index ledger_event_idx on ledger_entries (event_id);

create table payouts (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors, amount_paise bigint not null,
  mode text not null default 'simulated_route_transfer', created_at timestamptz not null default now()
);

create table ai_runs (
  id bigint generated always as identity primary key,
  feature text not null, model text, latency_ms int, input_hash text, eval_label text,
  created_at timestamptz not null default now()
);

create table audit_log (
  id bigint generated always as identity primary key,
  actor uuid, action text not null, target text, at timestamptz not null default now()
);

-- Reconciliation view: must always read 0.
create view ledger_reconciliation as
  select coalesce(sum(debit_paise),0) as total_debit, coalesce(sum(credit_paise),0) as total_credit,
         coalesce(sum(debit_paise),0) - coalesce(sum(credit_paise),0) as difference
  from ledger_entries;

-- Every event must balance (deferred constraint trigger).
create or replace function assert_event_balanced() returns trigger language plpgsql as $$
begin
  if (select sum(debit_paise) - sum(credit_paise) from ledger_entries where event_id = new.event_id) <> 0 then
    raise exception 'ledger event % is unbalanced', new.event_id;
  end if;
  return null;
end $$;
create constraint trigger ledger_balanced after insert on ledger_entries
  deferrable initially deferred for each row execute function assert_event_balanced();
