-- Silentium — closing ways to burn the model budget.
-- 1) Failed attempts now count toward daily attempt caps (they used to be free, so a crafted request
--    that made the model fail could be repeated forever).
-- 2) A site-wide daily ceiling per feature, whatever the number of accounts and IPs.
-- 3) Wardrobes can't grow without bound.

create or replace function public.claim_layering_generation(
  p_user uuid, p_ip_hash text, p_lang text, p_wardrobe jsonb,
  p_user_limit int default 3,      -- successful blends per account, lifetime
  p_ip_limit int default 10,       -- attempts per IP per day (any outcome)
  p_user_attempts int default 6,   -- attempts per account per day (any outcome)
  p_global_limit int default 300   -- attempts across the whole site per day
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
  new_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('layering:' || p_user::text, 0));

  select count(*) into n from public.layering_generations where user_id = p_user and status <> 'failed';
  if n >= p_user_limit then raise exception 'limit_user'; end if;

  select count(*) into n from public.layering_generations where user_id = p_user and created_at > now() - interval '1 day';
  if n >= p_user_attempts then raise exception 'limit_attempts'; end if;

  if p_ip_hash is not null then
    select count(*) into n from public.layering_generations where ip_hash = p_ip_hash and created_at > now() - interval '1 day';
    if n >= p_ip_limit then raise exception 'limit_ip'; end if;
  end if;

  select count(*) into n from public.layering_generations where created_at > now() - interval '1 day';
  if n >= p_global_limit then raise exception 'limit_global'; end if;

  insert into public.layering_generations (user_id, ip_hash, lang, wardrobe)
    values (p_user, p_ip_hash, p_lang, p_wardrobe)
    returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.claim_wardrobe_scan(
  p_user uuid, p_ip_hash text,
  p_user_limit int default 10,      -- scans per account per day (any outcome)
  p_ip_limit int default 20,        -- scans per IP per day (any outcome)
  p_global_limit int default 1000   -- scans across the whole site per day
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int;
  new_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended('scan:' || p_user::text, 0));

  select count(*) into n from public.wardrobe_scans where user_id = p_user and created_at > now() - interval '1 day';
  if n >= p_user_limit then raise exception 'scan_limit_user'; end if;

  if p_ip_hash is not null then
    select count(*) into n from public.wardrobe_scans where ip_hash = p_ip_hash and created_at > now() - interval '1 day';
    if n >= p_ip_limit then raise exception 'scan_limit_ip'; end if;
  end if;

  select count(*) into n from public.wardrobe_scans where created_at > now() - interval '1 day';
  if n >= p_global_limit then raise exception 'scan_limit_global'; end if;

  insert into public.wardrobe_scans (user_id, ip_hash) values (p_user, p_ip_hash) returning id into new_id;
  return new_id;
end;
$$;

-- New signatures: drop the old ones so nobody can call them, then lock both down to the server.
drop function if exists public.claim_layering_generation(uuid, text, text, jsonb, int, int);
revoke all on function public.claim_layering_generation(uuid, text, text, jsonb, int, int, int, int) from public, anon, authenticated;
grant execute on function public.claim_layering_generation(uuid, text, text, jsonb, int, int, int, int) to service_role;
revoke all on function public.claim_wardrobe_scan(uuid, text, int, int, int) from public, anon, authenticated;
grant execute on function public.claim_wardrobe_scan(uuid, text, int, int, int) to service_role;
drop function if exists public.claim_wardrobe_scan(uuid, text, int, int);

create index if not exists layering_generations_created_idx on public.layering_generations (created_at desc);
create index if not exists wardrobe_scans_created_idx on public.wardrobe_scans (created_at desc);

-- Wardrobes: at most 60 entries and ~20 KB per account
alter table public.wardrobes drop constraint if exists wardrobes_items_size;
alter table public.wardrobes add constraint wardrobes_items_size
  check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) <= 60 and pg_column_size(items) <= 20000);
