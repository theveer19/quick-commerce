-- ═══════════════════════════════════════════════════════════════
--  OneT India — push notifications (new arrivals, winter drop, sale…)
--  Run ONCE in Supabase Dashboard > SQL Editor. Safe to re-run.
-- ═══════════════════════════════════════════════════════════════

-- One row per phone that has the app and allowed notifications.
create table if not exists public.push_tokens (
  token      text primary key,              -- ExponentPushToken[...]
  platform   text,                          -- android | ios
  phone      text,                          -- set once the customer logs in
  active     boolean not null default true, -- false once Expo says the app was uninstalled
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);
create index if not exists push_tokens_active_idx on public.push_tokens (active);

-- History of what the admin sent.
create table if not exists public.push_campaigns (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text not null,
  url        text,
  sent       int not null default 0,
  failed     int not null default 0,
  sent_by    uuid,
  created_at timestamptz not null default now()
);

-- Only the server (service role) touches these tables. RLS on with no
-- policies = the public app key can neither read nor write them.
alter table public.push_tokens    enable row level security;
alter table public.push_campaigns enable row level security;
