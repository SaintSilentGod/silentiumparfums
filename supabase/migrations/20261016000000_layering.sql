-- Silentium — layering atelier: wardrobes, generations and the per-user / per-IP limit.

-- A user's perfume wardrobe (what they own). Users read and write only their own row.
create table if not exists public.wardrobes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.wardrobes enable row level security;

create policy "own wardrobe: read" on public.wardrobes
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "own wardrobe: insert" on public.wardrobes
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "own wardrobe: update" on public.wardrobes
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Every layering generation. Written only by the edge function (service role); users may read their own.
create table if not exists public.layering_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ip_hash text,
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  lang text,
  wardrobe jsonb,
  result jsonb,
  error text,
  model text,
  created_at timestamptz not null default now()
);
create index if not exists layering_generations_user_idx on public.layering_generations (user_id, created_at desc);
create index if not exists layering_generations_ip_idx on public.layering_generations (ip_hash, created_at desc);
alter table public.layering_generations enable row level security;

create policy "own generations: read" on public.layering_generations
  for select to authenticated using ((select auth.uid()) = user_id);

-- Claim one generation atomically. Failed generations don't count against the limit.
-- Returns the new row id, or raises 'limit_user' / 'limit_ip'.
create or replace function public.claim_layering_generation(
  p_user uuid, p_ip_hash text, p_lang text, p_wardrobe jsonb,
  p_user_limit int default 3, p_ip_limit int default 6
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  used int;
  ip_used int;
  new_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_user::text, 0));

  select count(*) into used from public.layering_generations
    where user_id = p_user and status <> 'failed';
  if used >= p_user_limit then
    raise exception 'limit_user';
  end if;

  if p_ip_hash is not null then
    select count(*) into ip_used from public.layering_generations
      where ip_hash = p_ip_hash and status <> 'failed' and created_at > now() - interval '1 day';
    if ip_used >= p_ip_limit then
      raise exception 'limit_ip';
    end if;
  end if;

  insert into public.layering_generations (user_id, ip_hash, lang, wardrobe)
    values (p_user, p_ip_hash, p_lang, p_wardrobe)
    returning id into new_id;
  return new_id;
end;
$$;

-- Only the edge function (service role) may claim generations.
revoke all on function public.claim_layering_generation(uuid, text, text, jsonb, int, int) from public, anon, authenticated;
grant execute on function public.claim_layering_generation(uuid, text, text, jsonb, int, int) to service_role;

-- Request journal (from server/requests.sql) lives in the same project.
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
alter table public.fragrance_requests enable row level security;
