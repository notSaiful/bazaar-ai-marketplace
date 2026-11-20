-- Row Level Security. Writes to money tables happen only via server code (service role) or SECURITY DEFINER functions.
create or replace function app_role() returns text language sql stable as
  $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', 'customer') $$;
create or replace function my_vendor_ids() returns setof uuid language sql stable security definer as
  $$ select id from vendors where owner_id = auth.uid() $$;

alter table profiles enable row level security;
alter table vendors enable row level security;
alter table products enable row level security;
alter table order_groups enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_events enable row level security;
alter table payments enable row level security;
alter table ledger_entries enable row level security;
alter table payouts enable row level security;
alter table ai_runs enable row level security;
alter table audit_log enable row level security;

-- profiles
create policy profiles_self on profiles for select using (id = auth.uid() or app_role() = 'admin');
create policy profiles_self_update on profiles for update using (id = auth.uid());

-- vendors: public reads active; owner reads/updates own (cannot change status or commission); admin all
create policy vendors_public on vendors for select using (status = 'active' or owner_id = auth.uid() or app_role() = 'admin');
create policy vendors_insert on vendors for insert with check (owner_id = auth.uid() and status = 'pending' and commission_bps = 1000);
create policy vendors_owner_update on vendors for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and status = (select status from vendors v where v.id = vendors.id)
              and commission_bps = (select commission_bps from vendors v where v.id = vendors.id));
create policy vendors_admin on vendors for all using (app_role() = 'admin');

-- products: public reads live products of active vendors; vendor writes own; pending vendors cannot publish; admin all
create policy products_public on products for select using (
  (status = 'live' and exists (select 1 from vendors v where v.id = vendor_id and v.status = 'active'))
  or vendor_id in (select my_vendor_ids()) or app_role() = 'admin');
create policy products_vendor_write on products for insert with check (
  vendor_id in (select my_vendor_ids())
  and (status <> 'live' or exists (select 1 from vendors v where v.id = vendor_id and v.status = 'active')));
create policy products_vendor_update on products for update using (vendor_id in (select my_vendor_ids()))
  with check (vendor_id in (select my_vendor_ids())
  and (status <> 'live' or exists (select 1 from vendors v where v.id = vendor_id and v.status = 'active')));
create policy products_admin on products for all using (app_role() = 'admin');

-- orders & friends: buyer reads own; vendor reads own store; admin all. No client writes (server code only).
create policy groups_read on order_groups for select using (buyer_id = auth.uid() or app_role() = 'admin');
create policy orders_read on orders for select using (
  vendor_id in (select my_vendor_ids()) or app_role() = 'admin'
  or group_id in (select id from order_groups where buyer_id = auth.uid()));
create policy items_read on order_items for select using (order_id in (select id from orders));  -- inherits orders policy
create policy events_read on order_events for select using (order_id in (select id from orders));
-- Vendors may only advance fulfilment through this function (validates transitions); direct UPDATE is not granted.

-- payments: server only; admin read
create policy payments_admin on payments for select using (app_role() = 'admin');

-- ledger: vendor reads own; admin all; no client writes
create policy ledger_vendor on ledger_entries for select using (vendor_id in (select my_vendor_ids()) or app_role() = 'admin');
create policy payouts_read on payouts for select using (vendor_id in (select my_vendor_ids()) or app_role() = 'admin');
create policy ai_runs_admin on ai_runs for select using (app_role() = 'admin');
create policy audit_admin on audit_log for select using (app_role() = 'admin');

revoke insert, update, delete on orders, order_groups, order_items, order_events, payments, ledger_entries, payouts from anon, authenticated;
