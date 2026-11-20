-- Atomic stock reservation, idempotent capture, fulfilment transitions, refunds. All SECURITY DEFINER; called by server code.

-- Reserve stock for every line or none. Row locks + CHECK (stock >= 0) make the last unit go to exactly one buyer.
create or replace function reserve_stock(p_items jsonb) returns void language plpgsql security definer as $$
declare it jsonb; ok boolean;
begin
  for it in select * from jsonb_array_elements(p_items) order by (value->>'product_id') loop   -- stable lock order avoids deadlocks
    update products set stock = stock - (it->>'qty')::int
      where id = (it->>'product_id')::uuid and stock >= (it->>'qty')::int and status = 'live';
    if not found then raise exception 'insufficient_stock:%', it->>'product_id'; end if;
  end loop;
end $$;

create or replace function release_group(p_group uuid, p_status group_status) returns void language plpgsql security definer as $$
begin
  if (select status from order_groups where id = p_group for update) <> 'pending_payment' then return; end if;
  update products p set stock = p.stock + i.qty from order_items i join orders o on o.id = i.order_id
    where o.group_id = p_group and i.product_id = p.id;
  update orders set status = 'cancelled' where group_id = p_group;
  update order_groups set status = p_status where id = p_group;
end $$;

-- Idempotent capture: payments.id is the primary key, so a replayed webhook inserts nothing and returns false.
create or replace function capture_payment(p_group uuid, p_payment text, p_raw jsonb) returns boolean language plpgsql security definer as $$
declare o record; ev text;
begin
  insert into payments (id, group_id, amount_paise, status, raw)
    select p_payment, p_group, total_paise, 'captured', p_raw from order_groups where id = p_group
    on conflict (id) do nothing;
  if not found then return false; end if;                       -- duplicate event: no-op
  update order_groups set status = 'paid' where id = p_group and status = 'pending_payment';
  for o in select * from orders where group_id = p_group loop
    ev := 'evt_pay_' || o.id;
    update orders set status = 'placed' where id = o.id;
    insert into order_events (order_id, status, note) values (o.id, 'placed', 'Payment captured');
    insert into ledger_entries (event_id, event_type, account, debit_paise, credit_paise, order_id, vendor_id, memo) values
      (ev, 'payment_captured', 'gateway_clearing', o.gross_paise, 0, o.id, o.vendor_id, p_payment),
      (ev, 'payment_captured', 'seller_payable:' || o.vendor_id, 0, o.payout_paise, o.id, o.vendor_id, p_payment),
      (ev, 'payment_captured', 'platform_commission', 0, o.commission_paise, o.id, o.vendor_id, p_payment);
  end loop;
  return true;
end $$;

create or replace function advance_order(p_order uuid, p_to order_status) returns void language plpgsql security definer as $$
declare cur order_status;
begin
  select status into cur from orders where id = p_order and vendor_id in (select my_vendor_ids()) for update;
  if cur is null then raise exception 'not_your_order'; end if;
  if not ((cur, p_to) in (('placed','accepted'),('accepted','packed'),('packed','shipped'),('shipped','delivered'))) then
    raise exception 'invalid_transition:% -> %', cur, p_to; end if;
  update orders set status = p_to where id = p_order;
  insert into order_events (order_id, status) values (p_order, p_to);
end $$;

create or replace function refund_order(p_order uuid) returns void language plpgsql security definer as $$
declare o orders; ev text;
begin
  if app_role() <> 'admin' then raise exception 'admin_only'; end if;
  select * into o from orders where id = p_order for update;
  if o.status not in ('placed','accepted','packed','shipped','delivered') then raise exception 'not_refundable'; end if;
  ev := 'evt_refund_' || o.id;
  insert into ledger_entries (event_id, event_type, account, debit_paise, credit_paise, order_id, vendor_id, memo) values
    (ev, 'refund', 'seller_payable:' || o.vendor_id, o.payout_paise, 0, o.id, o.vendor_id, 'refund'),
    (ev, 'refund', 'platform_commission', o.commission_paise, 0, o.id, o.vendor_id, 'refund'),
    (ev, 'refund', 'gateway_clearing', 0, o.gross_paise, o.id, o.vendor_id, 'refund');
  if o.status in ('placed','accepted','packed') then
    update products p set stock = p.stock + i.qty from order_items i where i.order_id = o.id and i.product_id = p.id;
  end if;
  update orders set status = 'refunded', refunded_paise = gross_paise where id = o.id;
  insert into order_events (order_id, status, note) values (o.id, 'refunded', 'Refunded; commission and payout reversed');
end $$;

-- Hybrid search: full-text rank + vector rank merged with reciprocal rank fusion. Falls back to FTS when p_embedding is null.
create or replace function search_products(p_query text, p_embedding vector(1536) default null, p_limit int default 20)
returns table (id uuid, score float) language sql stable as $$
  with fts as (
    select id, row_number() over (order by ts_rank(fts, websearch_to_tsquery('simple', p_query)) desc) rk
    from products where status = 'live' and fts @@ websearch_to_tsquery('simple', p_query) limit 50),
  vec as (
    select id, row_number() over (order by embedding <=> p_embedding) rk
    from products where status = 'live' and p_embedding is not null and embedding is not null limit 50)
  select coalesce(f.id, v.id), coalesce(1.0/(60+f.rk),0) + coalesce(1.0/(60+v.rk),0) as score
  from fts f full outer join vec v on v.id = f.id order by score desc limit p_limit
$$;
