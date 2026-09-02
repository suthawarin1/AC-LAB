-- ============================================================
-- THE AC LAB — Supabase schema
-- Main website + Awards subweb + IP / Patents / Petty Patents
-- Safe to run in Supabase SQL Editor.
-- Canonical website CMS: public.site_content id=1.
-- data.ipAssets and data.awards are used by the main site + subwebs.
-- public.ip_assets and public.awards are normalized mirrors maintained by Manager.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1) Shared CMS JSON store used by the current index.html
-- ------------------------------------------------------------
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

drop policy if exists "site_content_admin_delete" on public.site_content;
create policy "site_content_admin_delete"
on public.site_content for delete
to authenticated
using (true);

-- ------------------------------------------------------------
-- 2) DOI locker used by the Publications section
-- ------------------------------------------------------------
create table if not exists public.doi_pubs (
  id uuid primary key default gen_random_uuid(),
  doi text not null unique,
  created_at timestamptz not null default now(),
  created_by uuid null default auth.uid()
);

alter table public.doi_pubs enable row level security;

drop policy if exists "doi_public_read" on public.doi_pubs;
create policy "doi_public_read"
on public.doi_pubs for select
to anon, authenticated
using (true);

drop policy if exists "doi_admin_all" on public.doi_pubs;
create policy "doi_admin_all"
on public.doi_pubs for all
to authenticated
using (true)
with check (true);

-- ------------------------------------------------------------
-- 3) Contact messages
-- ------------------------------------------------------------
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "contact_public_insert" on public.contact_messages;
create policy "contact_public_insert"
on public.contact_messages for insert
to anon, authenticated
with check (true);

drop policy if exists "contact_admin_select" on public.contact_messages;
create policy "contact_admin_select"
on public.contact_messages for select
to authenticated
using (true);

drop policy if exists "contact_admin_update" on public.contact_messages;
create policy "contact_admin_update"
on public.contact_messages for update
to authenticated
using (true)
with check (true);

drop policy if exists "contact_admin_delete" on public.contact_messages;
create policy "contact_admin_delete"
on public.contact_messages for delete
to authenticated
using (true);

-- ------------------------------------------------------------
-- 4) Testimonial submissions
-- ------------------------------------------------------------
create table if not exists public.testimonial_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  quote text not null,
  img text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table public.testimonial_submissions enable row level security;

drop policy if exists "testimonial_public_insert" on public.testimonial_submissions;
create policy "testimonial_public_insert"
on public.testimonial_submissions for insert
to anon, authenticated
with check (status = 'pending');

drop policy if exists "testimonial_admin_select" on public.testimonial_submissions;
create policy "testimonial_admin_select"
on public.testimonial_submissions for select
to authenticated
using (true);

drop policy if exists "testimonial_admin_update" on public.testimonial_submissions;
create policy "testimonial_admin_update"
on public.testimonial_submissions for update
to authenticated
using (true)
with check (true);

drop policy if exists "testimonial_admin_delete" on public.testimonial_submissions;
create policy "testimonial_admin_delete"
on public.testimonial_submissions for delete
to authenticated
using (true);

-- ------------------------------------------------------------
-- 5) Awards / honours subweb
-- This is normalized storage for future use. The current Awards
-- subweb also keeps a compatible awards array in site_content.data.
-- ------------------------------------------------------------
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

drop policy if exists "awards_admin_all" on public.awards;
create policy "awards_admin_all"
on public.awards for all
to authenticated
using (true)
with check (true);

-- ------------------------------------------------------------
-- 6) Intellectual Property / Patents / Petty Patents
-- IMPORTANT: this is the SQL for the IP section you requested.
-- kind values used by the current website:
--   petty-granted       = อนุสิทธิบัตร ได้รับจดทะเบียนแล้ว
--   petty-application   = คำขออนุสิทธิบัตร
--   patent-granted      = สิทธิบัตร ได้รับจดทะเบียนแล้ว
--   patent-application  = คำขอสิทธิบัตร
-- ------------------------------------------------------------
create table if not exists public.ip_assets (
  id uuid primary key default gen_random_uuid(),
  item_no text not null unique,
  formula_th text not null,
  formula_en text,
  kind text not null check (
    kind in (
      'petty-granted',
      'petty-application',
      'patent-granted',
      'patent-application'
    )
  ),
  registration_number text,
  filing_or_grant_date_text text,
  trade_name text,
  product_registration text,
  image_url text,
  notes text,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ip_assets enable row level security;

drop policy if exists "ip_assets_public_read" on public.ip_assets;
create policy "ip_assets_public_read"
on public.ip_assets for select
to anon, authenticated
using (is_visible = true or auth.role() = 'authenticated');

drop policy if exists "ip_assets_admin_insert" on public.ip_assets;
create policy "ip_assets_admin_insert"
on public.ip_assets for insert
to authenticated
with check (true);

drop policy if exists "ip_assets_admin_update" on public.ip_assets;
create policy "ip_assets_admin_update"
on public.ip_assets for update
to authenticated
using (true)
with check (true);

drop policy if exists "ip_assets_admin_delete" on public.ip_assets;
create policy "ip_assets_admin_delete"
on public.ip_assets for delete
to authenticated
using (true);

-- Seed the current 13 IP records from the website.
insert into public.ip_assets
(item_no, formula_th, formula_en, kind, registration_number,
 filing_or_grant_date_text, trade_name, product_registration, sort_order)
values
('01','ผลิตภัณฑ์โอลีเอไมด์ในน้ำมันรำข้าว','Rice-bran-oil oleamide product','petty-granted','19554','30 มีนาคม 2565','Nat OleA','เลขสารบบอาหาร อย. 20-1-13451-5-0086 · 3 กุมภาพันธ์ 2564',1),
('02','สูตรซีรั่มบำรุงเส้นผมและหนังศีรษะ','Hair and scalp nourishing serum formula','patent-application','2001000059','15 พฤศจิกายน 2562','Nat Hair Serum','ใบรับจดแจ้ง 20-1-6400028970 · 1 กรกฎาคม 2567',2),
('03','สูตรแชมพูสระผม','Shampoo formula','petty-granted','21065','7 มีนาคม 2566','Nat Hair Shampoo','ใบรับจดแจ้ง 20-1-6400028990 · 2 สิงหาคม 2564',3),
('04','สูตรสารสกัดต้านการอักเสบสำหรับแผลที่ผิวหนัง','Anti-inflammatory extract formula for skin wounds','petty-granted','25893','30 มิถุนายน 2563','Nat Amy','ใบรับจดแจ้ง 20-1-6400036317 · 22 กันยายน 2564',4),
('05','ผลิตภัณฑ์ลดความอยากอาหารและคอเลสเตอรอล','Appetite- and cholesterol-reducing product','petty-granted','23068','20 ธันวาคม 2564','Nat OneC','เลขสารบบอาหาร อย. 20-1-13451-5-0101 · 14 ธันวาคม 2564',5),
('06','สูตรสมุนไพรเสริมสร้างคอลลาเจน','Herbal collagen-support formula','petty-granted','26211','21 สิงหาคม 2568','Wonwi','เลขสารบบอาหาร อย. 20-1-13451-5-0110 · 23 มีนาคม 2565',6),
('07','สูตรครีมกันแดดที่มีส่วนประกอบผลยอและใบมะหาด','Sunscreen formula containing noni fruit and lakoocha leaves','petty-application','2303000724','14 มีนาคม 2566','EPA Sunscreen','ใบรับจดแจ้ง 40-1-6700006088 · 22 กุมภาพันธ์ 2567',7),
('08','เจลล้างหน้าจากสารสกัดพืช','Plant-extract facial cleansing gel','petty-application','2403002488','8 สิงหาคม 2567','EPC Cleansing Gel','ใบรับจดแจ้ง 40-16700005985 · 21 กุมภาพันธ์ 2567',8),
('09','สูตรส่วนผสมยาระบาย มะขาม : มะขามแขก','Laxative blend: tamarind and senna','petty-application','2403002602','16 สิงหาคม 2567','Nat Lax','ทะเบียนยา G 481/2568 · ผลิตจากใบและฝักมะขามแขก',9),
('10','ผงปรุงรสต้มยำ ลดเค็ม','Reduced-sodium tom yum seasoning powder','petty-application','2503003888','3 ตุลาคม 2568','','',10),
('11','ผงปรุงรสแกงจืด ลดเค็ม','Reduced-sodium clear-soup seasoning powder','petty-application','2503003886','3 ตุลาคม 2568','','',11),
('12','สูตรส่วนผสมสำหรับแคปซูลที่มีสารสกัดใบกระทุ่มเนินและสารสกัดผักบุ้ง','Capsule formula with Kratum Noen leaf and water-spinach extracts','patent-application','2501001075','19 กุมภาพันธ์ 2568','RhynoleA','ดำเนินการจดทะเบียนยา โดย PharmCare Pharmaceutical คณะเภสัชศาสตร์ มหาวิทยาลัยมหาสารคาม',12),
('13','สูตรส่วนผสมสำหรับแคปซูลที่มีส่วนผสมของเพชรสังฆาตและส้มแขก','Capsule formula containing Cissus quadrangularis and Garcinia','patent-application','2601003650','24 พฤษภาคม 2569','','',13)
on conflict (item_no) do update set
  formula_th = excluded.formula_th,
  formula_en = excluded.formula_en,
  kind = excluded.kind,
  registration_number = excluded.registration_number,
  filing_or_grant_date_text = excluded.filing_or_grant_date_text,
  trade_name = excluded.trade_name,
  product_registration = excluded.product_registration,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Convenient views for the website / manager.
create or replace view public.petty_patents as
select *
from public.ip_assets
where kind in ('petty-granted','petty-application')
order by sort_order, item_no;

create or replace view public.patents as
select *
from public.ip_assets
where kind in ('patent-granted','patent-application')
order by sort_order, item_no;

-- ------------------------------------------------------------
-- Grants
-- ------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.site_content to anon, authenticated;
grant select on public.doi_pubs to anon, authenticated;
grant select on public.ip_assets to anon, authenticated;
grant select on public.awards to anon, authenticated;
grant select on public.petty_patents to anon, authenticated;
grant select on public.patents to anon, authenticated;

grant insert, update, delete on public.site_content to authenticated;
grant insert, update, delete on public.doi_pubs to authenticated;
grant insert, update, delete on public.ip_assets to authenticated;
grant insert, update, delete on public.awards to authenticated;

grant insert on public.contact_messages to anon, authenticated;
grant select, update, delete on public.contact_messages to authenticated;

grant insert on public.testimonial_submissions to anon, authenticated;
grant select, update, delete on public.testimonial_submissions to authenticated;

-- ------------------------------------------------------------
-- Optional helper trigger for updated_at columns
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_site_content_updated_at on public.site_content;
create trigger trg_site_content_updated_at
before update on public.site_content
for each row execute function public.set_updated_at();

drop trigger if exists trg_ip_assets_updated_at on public.ip_assets;
create trigger trg_ip_assets_updated_at
before update on public.ip_assets
for each row execute function public.set_updated_at();

drop trigger if exists trg_awards_updated_at on public.awards;
create trigger trg_awards_updated_at
before update on public.awards
for each row execute function public.set_updated_at();
