-- ═══════════════════════════════════════════════════════════════
--  OneT India — Supabase schema (accounts + roles + secure orders)
--  Run in Supabase Dashboard > SQL Editor.  Safe to re-run.
-- ═══════════════════════════════════════════════════════════════

-- clean the app tables (products/orders) — keeps auth.users intact
drop table if exists public.orders   cascade;
drop table if exists public.products cascade;

-- ── PROFILES (one row per auth user; holds name/phone/role) ─────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  phone      text,
  role       text not null default 'customer',   -- 'customer' | 'admin'
  created_at timestamptz not null default now()
);

-- auto-create a profile whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, phone)
  values (new.id, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'phone')
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ── PRODUCTS ───────────────────────────────────────────────────
create table public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null,
  subcategory text,
  price       numeric not null check (price >= 0),
  mrp         numeric,
  stock       integer not null default 0 check (stock >= 0),
  sizes       text[] default '{}',
  colors      jsonb default '[]',
  image       text,
  description text,
  rating      numeric,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── ORDERS ─────────────────────────────────────────────────────
create table public.orders (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,
  user_id           uuid references auth.users(id) on delete set null,
  customer          jsonb not null,
  address           jsonb not null,
  items             jsonb not null,
  subtotal          numeric not null,
  delivery          numeric not null default 0,
  total             numeric not null,
  payment_method    text not null default 'tryandbuy',
  payment_status    text not null default 'pending',
  payment_id        text,
  razorpay_order_id text,
  status            text not null default 'placed',
  created_at        timestamptz not null default now()
);

create index orders_code_idx    on public.orders (code);
create index orders_user_idx     on public.orders (user_id);
create index orders_rzp_idx      on public.orders (razorpay_order_id);
create index orders_status_idx   on public.orders (status);
create index products_cat_idx    on public.products (category);

-- atomic guarded stock decrement (never negative)
create or replace function public.decrement_stock(p_id uuid, p_qty int)
returns void language plpgsql security definer as $$
begin
  update public.products set stock = stock - p_qty
   where id = p_id and stock >= p_qty;
end; $$;

-- ═══ Row Level Security ════════════════════════════════════════
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders   enable row level security;

-- profiles: user sees/edits only their own
drop policy if exists "read own profile"   on public.profiles;
drop policy if exists "update own profile" on public.profiles;
create policy "read own profile"   on public.profiles for select to authenticated using ( auth.uid() = id );
create policy "update own profile" on public.profiles for update to authenticated using ( auth.uid() = id );

-- products: everyone reads active items; only admins manage
drop policy if exists "products readable" on public.products;
drop policy if exists "admins manage products" on public.products;
create policy "products readable" on public.products for select using ( is_active = true );
create policy "admins manage products" on public.products for all to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );

-- orders: a user reads only their own; admins read all; only admins update.
-- (Creation happens on the server with the service role, which bypasses RLS.)
drop policy if exists "read own or admin orders" on public.orders;
drop policy if exists "admins update orders"     on public.orders;
create policy "read own or admin orders" on public.orders for select to authenticated
  using ( auth.uid() = user_id or public.is_admin() );
create policy "admins update orders" on public.orders for update to authenticated
  using ( public.is_admin() ) with check ( public.is_admin() );

-- ═══ AFTER RUNNING: make yourself an admin ═════════════════════
-- 1) Create your admin user in Authentication > Users (or sign up in the app).
-- 2) Then run (replace with your email):
--    update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'you@example.com');
