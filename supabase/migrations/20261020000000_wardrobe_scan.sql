-- Silentium — reading a wardrobe from a photo of the shelf.
-- Scans don't spend layering generations; they have their own daily limit per user and per IP.

create table if not exists public.wardrobe_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ip_hash text,
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  items jsonb,
  error text,
  model text,
  created_at timestamptz not null default now()
);
create index if not exists wardrobe_scans_user_idx on public.wardrobe_scans (user_id, created_at desc);
create index if not exists wardrobe_scans_ip_idx on public.wardrobe_scans (ip_hash, created_at desc);
alter table public.wardrobe_scans enable row level security;

drop policy if exists "own scans: read" on public.wardrobe_scans;
create policy "own scans: read" on public.wardrobe_scans
  for select to authenticated using ((select auth.uid()) = user_id);

-- Returns the new scan id, or raises 'scan_limit_user' / 'scan_limit_ip'. Failed scans don't count.
create or replace function public.claim_wardrobe_scan(
  p_user uuid, p_ip_hash text, p_user_limit int default 10, p_ip_limit int default 20
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
  perform pg_advisory_xact_lock(hashtextextended('scan:' || p_user::text, 0));

  select count(*) into used from public.wardrobe_scans
    where user_id = p_user and status <> 'failed' and created_at > now() - interval '1 day';
  if used >= p_user_limit then
    raise exception 'scan_limit_user';
  end if;

  if p_ip_hash is not null then
    select count(*) into ip_used from public.wardrobe_scans
      where ip_hash = p_ip_hash and status <> 'failed' and created_at > now() - interval '1 day';
    if ip_used >= p_ip_limit then
      raise exception 'scan_limit_ip';
    end if;
  end if;

  insert into public.wardrobe_scans (user_id, ip_hash) values (p_user, p_ip_hash) returning id into new_id;
  return new_id;
end;
$$;

revoke all on function public.claim_wardrobe_scan(uuid, text, int, int) from public, anon, authenticated;
grant execute on function public.claim_wardrobe_scan(uuid, text, int, int) to service_role;
