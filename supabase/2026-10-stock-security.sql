-- ═══════════════════════════════════════════════════════════════
--  OneT India — Oct 2026 update: atomic stock reservation
--  Run ONCE in Supabase Dashboard > SQL Editor. Safe to re-run.
--  Does not drop or change any existing data.
-- ═══════════════════════════════════════════════════════════════

-- Reserve stock for an order. Returns TRUE only if the full quantity was
-- available and has now been taken; FALSE means "out of stock" and nothing
-- changed. Two customers racing for the last piece: exactly one gets TRUE.
create or replace function public.reserve_stock(p_id uuid, p_qty int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if p_qty is null or p_qty < 1 then return false; end if;
  update public.products
     set stock = stock - p_qty
   where id = p_id and is_active = true and stock >= p_qty;
  get diagnostics n = row_count;
  return n = 1;
end; $$;

-- Give stock back (used if an order fails to save after reserving).
create or replace function public.increment_stock(p_id uuid, p_qty int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_qty is null or p_qty < 1 then return; end if;
  update public.products set stock = stock + p_qty where id = p_id;
end; $$;

-- Only the server (service role) may call these — never the public app key.
revoke all on function public.reserve_stock(uuid, int)   from public, anon, authenticated;
revoke all on function public.increment_stock(uuid, int) from public, anon, authenticated;
grant execute on function public.reserve_stock(uuid, int)   to service_role;
grant execute on function public.increment_stock(uuid, int) to service_role;
-- The old decrement_stock was callable with the PUBLIC app key, so anyone could
-- zero out a product's stock from the browser console. Lock it down too.
do $$ begin
  revoke all on function public.decrement_stock(uuid, int) from public, anon, authenticated;
  grant execute on function public.decrement_stock(uuid, int) to service_role;
exception when undefined_function then null; end $$;

-- Stock can never go negative.
do $$ begin
  alter table public.products add constraint products_stock_nonneg check (stock >= 0);
exception when others then null; end $$;
