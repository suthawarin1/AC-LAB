-- ============================================================
-- THE AC LAB — IP / PATENTS / PETTY PATENTS MANAGER
-- Same Supabase project and same CMS row as the main website.
--
-- Website source of truth:
--   public.site_content (id = 1)
--   data->'ipAssets'
--
-- Normalized mirror for reporting/querying:
--   public.ip_assets
--
-- The current Manager writes site_content safely (JSON merge) and
-- mirrors the same records into public.ip_assets.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1) SHARED CMS ROW — required by main site + portfolio subweb
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

grant select on public.site_content to anon, authenticated;
grant insert, update on public.site_content to authenticated;

-- ------------------------------------------------------------
-- 2) NORMALIZED IP MIRROR
-- kind:
--   petty-granted       = อนุสิทธิบัตรที่ได้รับจดทะเบียน
--   petty-application   = คำขออนุสิทธิบัตร
--   patent-granted      = สิทธิบัตรที่ได้รับจดทะเบียน
--   patent-application  = คำขอสิทธิบัตร
-- ------------------------------------------------------------
create table if not exists public.ip_assets (
  id uuid primary key default gen_random_uuid(),
  item_no text not null unique,
  formula_th text not null,
  formula_en text,
  kind text not null check (
    kind in ('petty-granted','petty-application','patent-granted','patent-application')
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

grant select on public.ip_assets to anon, authenticated;
grant insert, update, delete on public.ip_assets to authenticated;

-- ------------------------------------------------------------
-- 3) CURRENT 13 IP RECORDS
-- ------------------------------------------------------------
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
('10','ผงปรุงรสต้มยำ ลดเค็ม','Reduced-sodium tom yum seasoning powder','petty-application','2503003888','3 ตุลาคม 2568',null,null,10),
('11','ผงปรุงรสแกงจืด ลดเค็ม','Reduced-sodium clear-soup seasoning powder','petty-application','2503003886','3 ตุลาคม 2568',null,null,11),
('12','สูตรส่วนผสมสำหรับแคปซูลที่มีสารสกัดใบกระทุ่มเนินและสารสกัดผักบุ้ง','Capsule formula with Kratum Noen leaf and water-spinach extracts','patent-application','2501001075','19 กุมภาพันธ์ 2568','RhynoleA','ดำเนินการจดทะเบียนยา โดย PharmCare Pharmaceutical คณะเภสัชศาสตร์ มหาวิทยาลัยมหาสารคาม',12),
('13','สูตรส่วนผสมสำหรับแคปซูลที่มีส่วนผสมของเพชรสังฆาตและส้มแขก','Capsule formula containing Cissus quadrangularis and Garcinia','patent-application','2601003650','24 พฤษภาคม 2569',null,null,13)
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

-- ------------------------------------------------------------
-- 4) CONVENIENCE VIEWS
-- ------------------------------------------------------------
create or replace view public.petty_patents as
select * from public.ip_assets
where kind in ('petty-granted','petty-application')
order by sort_order, item_no;

create or replace view public.patents as
select * from public.ip_assets
where kind in ('patent-granted','patent-application')
order by sort_order, item_no;

grant select on public.petty_patents, public.patents to anon, authenticated;
