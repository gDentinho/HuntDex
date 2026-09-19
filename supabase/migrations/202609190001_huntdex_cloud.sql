-- HuntDex cloud storage. Safe to run through Supabase migrations.
create table if not exists public.hunts (
  user_id uuid not null references auth.users(id) on delete cascade,
  id text not null,
  duplicate_key text not null,
  session_id bigint null,
  player text not null,
  start_text text null,
  start_timestamp bigint null,
  created_at_ms bigint not null,
  raw_json jsonb not null check (jsonb_typeof(raw_json) = 'object'),
  inserted_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, duplicate_key)
);

create index if not exists hunts_user_start_idx
  on public.hunts (user_id, start_timestamp desc nulls last);
create index if not exists hunts_user_player_idx
  on public.hunts (user_id, player);
create index if not exists hunts_user_session_idx
  on public.hunts (user_id, session_id)
  where session_id is not null;

alter table public.hunts enable row level security;
revoke all on table public.hunts from anon;
grant select, insert, update, delete on table public.hunts to authenticated;

drop policy if exists "huntdex_hunts_select_own" on public.hunts;
create policy "huntdex_hunts_select_own"
  on public.hunts for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "huntdex_hunts_insert_own" on public.hunts;
create policy "huntdex_hunts_insert_own"
  on public.hunts for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "huntdex_hunts_update_own" on public.hunts;
create policy "huntdex_hunts_update_own"
  on public.hunts for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "huntdex_hunts_delete_own" on public.hunts;
create policy "huntdex_hunts_delete_own"
  on public.hunts for delete to authenticated
  using ((select auth.uid()) = user_id);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  diamond_price numeric null check (diamond_price is null or diamond_price > 0),
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;
revoke all on table public.user_settings from anon;
grant select, insert, update, delete on table public.user_settings to authenticated;

drop policy if exists "huntdex_settings_select_own" on public.user_settings;
create policy "huntdex_settings_select_own"
  on public.user_settings for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "huntdex_settings_insert_own" on public.user_settings;
create policy "huntdex_settings_insert_own"
  on public.user_settings for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "huntdex_settings_update_own" on public.user_settings;
create policy "huntdex_settings_update_own"
  on public.user_settings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "huntdex_settings_delete_own" on public.user_settings;
create policy "huntdex_settings_delete_own"
  on public.user_settings for delete to authenticated
  using ((select auth.uid()) = user_id);
