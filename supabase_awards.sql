-- ============================================================
-- THE AC LAB — AWARDS / HONOURS MANAGER
-- Same Supabase project and same CMS row as the main website.
--
-- Website source of truth:
--   public.site_content (id = 1)
--   data->'awards'
--
-- Normalized mirror:
--   public.awards
-- ============================================================

create table if not exists public.site_content (
  id bigint primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.site_content (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

alter table public.site_content enable row level security;

drop policy if exists "site_content_public_read" on public.site_content;
create policy "site_content_public_read"
on public.site_content for select
to anon, authenticated
using (true);

drop policy if exists "site_content_admin_insert" on public.site_content;
create policy "site_content_admin_insert"
on public.site_content for insert
to authenticated
with check (true);

drop policy if exists "site_content_admin_update" on public.site_content;
create policy "site_content_admin_update"
on public.site_content for update
to authenticated
using (true)
with check (true);

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;

create table if not exists public.awards (
  id text primary key,
  year text,
  year_th text,
  level text,
  level_th text,
  award_type text,
  award_type_th text,
  title text not null,
  title_th text,
  description text,
  description_th text,
  photo_url text,
  shield_url text,
  gallery jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.awards enable row level security;

drop policy if exists "awards_public_read" on public.awards;
create policy "awards_public_read"
on public.awards for select
to anon, authenticated
using (true);

drop policy if exists "awards_admin_insert" on public.awards;
create policy "awards_admin_insert"
on public.awards for insert
to authenticated
with check (true);

drop policy if exists "awards_admin_update" on public.awards;
create policy "awards_admin_update"
on public.awards for update
to authenticated
using (true)
with check (true);

drop policy if exists "awards_admin_delete" on public.awards;
create policy "awards_admin_delete"
on public.awards for delete
to authenticated
using (true);

grant select on public.awards to anon, authenticated;
grant insert, update, delete on public.awards to authenticated;
