-- ═══════════════════════════════════════════════════════════════
--  OneT India — stock per size (Nov 2026)
--  Run ONCE in Supabase Dashboard > SQL Editor. Safe to re-run.
--  Nothing changes for existing products until you enter size-wise
--  quantities for them in Admin → Products.
-- ═══════════════════════════════════════════════════════════════

-- {"S": 3, "M": 0, "L": 5}   (empty {} = this product is not tracked by size)
alter table public.products add column if not exists size_stock jsonb not null default '{}'::jsonb;

-- Keep the total "stock" equal to the sum of the sizes, whatever writes the row.
create or replace function public.products_sync_size_stock()
returns trigger
language plpgsql
as $$
declare k text; v int; total int := 0; cleaned jsonb := '{}'::jsonb;
begin
  if new.size_stock is null or jsonb_typeof(new.size_stock) <> 'object' then
    new.size_stock := '{}'::jsonb;
  end if;
  if new.size_stock = '{}'::jsonb then
    return new;                         -- not tracked by size: leave stock alone
  end if;
  for k in select jsonb_object_keys(new.size_stock) loop
    begin
      v := greatest(0, coalesce((new.size_stock ->> k)::int, 0));
    exception when others then v := 0;
    end;
    cleaned := cleaned || jsonb_build_object(k, v);
    total := total + v;
  end loop;
  new.size_stock := cleaned;
  new.stock := total;
  return new;
end; $$;

drop trigger if exists products_sync_size_stock on public.products;
create trigger products_sync_size_stock
before insert or update on public.products
for each row execute function public.products_sync_size_stock();

-- Take p_qty pieces of one size. TRUE only if that size had enough.
-- Two customers racing for the last M: exactly one gets it.
create or replace function public.reserve_stock_size(p_id uuid, p_size text, p_qty int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  if p_qty is null or p_qty < 1 or p_size is null then return false; end if;
  update public.products
     set size_stock = jsonb_set(size_stock, array[p_size], to_jsonb(coalesce((size_stock ->> p_size)::int, 0) - p_qty))
   where id = p_id
     and is_active = true
     and size_stock ? p_size
     and coalesce((size_stock ->> p_size)::int, 0) >= p_qty;
  get diagnostics n = row_count;
  return n = 1;
end; $$;

-- Put pieces back (failed order, cancellation). Untracked products: total only.
create or replace function public.increment_stock_size(p_id uuid, p_size text, p_qty int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_qty is null or p_qty < 1 then return; end if;
  update public.products
     set size_stock = case when p_size is not null and size_stock ? p_size
                           then jsonb_set(size_stock, array[p_size], to_jsonb(coalesce((size_stock ->> p_size)::int, 0) + p_qty))
                           else size_stock end,
         stock = case when p_size is not null and size_stock ? p_size then stock else stock + p_qty end
   where id = p_id;
end; $$;

revoke all on function public.reserve_stock_size(uuid, text, int)   from public, anon, authenticated;
revoke all on function public.increment_stock_size(uuid, text, int) from public, anon, authenticated;
grant execute on function public.reserve_stock_size(uuid, text, int)   to service_role;
grant execute on function public.increment_stock_size(uuid, text, int) to service_role;
