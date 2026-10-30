-- ═══════════════════════════════════════════════════════════════
--  OneT India — real customer reviews (Oct 2026)
--  Run ONCE in Supabase Dashboard > SQL Editor. Safe to re-run, and safe
--  if an older "reviews" table already exists (it is upgraded in place).
--  Only customers whose order was DELIVERED can review (checked by the
--  server in /api/reviews), one review per product per order.
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  order_code  text,
  phone       text,
  name        text,
  rating      int  not null check (rating between 1 and 5),
  comment     text,
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- upgrade an older table, if there was one
alter table public.reviews add column if not exists order_code text;
alter table public.reviews add column if not exists phone      text;
alter table public.reviews add column if not exists name       text;
alter table public.reviews add column if not exists comment    text;
alter table public.reviews add column if not exists is_visible boolean not null default true;
alter table public.reviews add column if not exists updated_at timestamptz not null default now();
do $$ begin
  alter table public.reviews alter column user_id drop not null;
exception when undefined_column then null; end $$;
do $$ begin
  update public.reviews set comment = body where comment is null and body is not null;
exception when undefined_column then null; end $$;

create unique index if not exists reviews_order_product_uq on public.reviews (order_code, product_id);
create index if not exists reviews_product_idx on public.reviews (product_id, is_visible, created_at desc);

-- Average + count live on the product row so cards can show them cheaply.
alter table public.products add column if not exists rating_avg   numeric(2,1);
alter table public.products add column if not exists rating_count int not null default 0;

create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare pid uuid := coalesce(new.product_id, old.product_id);
begin
  update public.products p
     set rating_avg   = s.avg,
         rating_count = s.cnt
    from (select round(avg(rating)::numeric, 1) as avg, count(*)::int as cnt
            from public.reviews where product_id = pid and is_visible) s
   where p.id = pid;
  return null;
end; $$;

drop trigger if exists reviews_refresh_rating on public.reviews;
create trigger reviews_refresh_rating
after insert or update or delete on public.reviews
for each row execute function public.refresh_product_rating();

-- fill the counts once for any reviews that already exist
update public.products p
   set rating_avg = s.avg, rating_count = s.cnt
  from (select product_id, round(avg(rating)::numeric, 1) as avg, count(*)::int as cnt
          from public.reviews where is_visible group by product_id) s
 where p.id = s.product_id;

-- Server (service role) only. The website and app read reviews through /api/reviews.
alter table public.reviews enable row level security;

-- Old placeholder ratings were not from real customers — stop showing them.
do $$ begin
  update public.products set rating = null;
exception when undefined_column then null; end $$;
