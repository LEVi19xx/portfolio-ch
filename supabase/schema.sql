-- Database for the portfolio house. Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
--
-- Privacy by design: visitors can only ADD rows (letters, bouquet orders). Nobody can read them with the public key,
-- so a stranger can never list what other visitors wrote. You read them in the dashboard: Table Editor.

create extension if not exists pgcrypto;

-- letters written at the desk in the atelier
create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  from_name text not null default '' check (char_length(from_name) <= 40),
  message text not null check (char_length(message) between 1 and 700)
);

-- bouquet orders from the flower shop (flowers, gift card and delivery details)
create table if not exists public.bouquet_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  summary text not null check (char_length(summary) <= 500),
  bouquet jsonb not null,
  card jsonb not null,
  delivery jsonb not null,
  status text not null default 'new'
);

alter table public.letters enable row level security;
alter table public.bouquet_orders enable row level security;

-- the public (anon) key may insert, and nothing else
drop policy if exists "visitors can leave letters" on public.letters;
create policy "visitors can leave letters" on public.letters
  for insert to anon, authenticated with check (true);

drop policy if exists "visitors can place orders" on public.bouquet_orders;
create policy "visitors can place orders" on public.bouquet_orders
  for insert to anon, authenticated
  with check (status = 'new' and char_length(card::text) <= 2000 and char_length(delivery::text) <= 2000);

-- explicit permissions, so it works even if "Automatically expose new tables" is switched off:
-- the public key can add rows to these two tables and has no other access
grant usage on schema public to anon, authenticated;
grant insert on public.letters to anon, authenticated;
grant insert on public.bouquet_orders to anon, authenticated;
