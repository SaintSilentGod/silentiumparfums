-- Journal of fragrance requests (optional; used when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set).
-- Run once in the Supabase SQL editor.

create table if not exists public.fragrance_requests (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  perfume text,
  name text not null,
  telegram text,
  phone text,
  email text,
  lang text,
  page text,
  telegram_delivered boolean not null default false
);

-- Only the server (service role) may read or write; no public access at all.
alter table public.fragrance_requests enable row level security;
