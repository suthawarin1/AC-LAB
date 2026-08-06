-- ============================================================================
-- AreWarin Portal V12 — Public Registration Subweb + Admin Approval
-- ใช้ต่อจาก AreWarin Portal V11.1 โดยไม่ลบข้อมูลเดิม
-- เชื่อมคอร์ส ติวเตอร์ ตารางเรียน การชำระ Enrollment และ Portal Manager ชุดเดียวกัน
-- ============================================================================

begin;

create extension if not exists pgcrypto;
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- V12 ใช้โครงสร้างจาก V10/V11.1 ตรวจให้ชัดก่อนติดตั้งเพื่อไม่ให้รันค้างครึ่งทาง
do $$
begin
  if to_regclass('public.courses') is null
     or to_regclass('public.students') is null
     or to_regclass('public.tutor_directory') is null
     or to_regclass('public.student_course_enrollments') is null
     or to_regclass('public.student_course_schedules') is null then
    raise exception 'ยังไม่พบโครงสร้าง V11.1 กรุณาติดตั้ง V11/V11.1 ก่อนรัน SQL V12';
  end if;
  if to_regprocedure('public.admin_v10_save_student(jsonb,bigint[],uuid)') is null
     or to_regprocedure('private.v11_apply_course_rows(bigint,uuid,jsonb,text)') is null
     or to_regprocedure('private.v8_is_admin()') is null
     or to_regprocedure('private.v9_normalize_phone(text)') is null then
    raise exception 'ฟังก์ชันพื้นฐาน V10/V11.1 ไม่ครบ กรุณาติดตั้ง SQL รุ่นก่อนหน้าให้สำเร็จก่อน';
  end if;
end $$;

-- --------------------------------------------------------------------------
-- 1) ขยายข้อมูลคอร์สสำหรับหน้าเปิดรับสมัคร
-- --------------------------------------------------------------------------
alter table public.courses add column if not exists subject_name text not null default '';
alter table public.courses add column if not exists target_levels text[] not null default '{}'::text[];
alter table public.courses add column if not exists registration_summary text not null default '';
alter table public.courses add column if not exists registration_requirements text not null default '';
alter table public.courses add column if not exists intro_video_url text not null default '';
alter table public.courses add column if not exists allow_individual boolean not null default true;
alter table public.courses add column if not exists allow_group boolean not null default true;
alter table public.courses add column if not exists min_group_size integer not null default 2;
alter table public.courses add column if not exists max_group_size integer not null default 10;
alter table public.courses add column if not exists registration_sort_order integer not null default 0;
alter table public.courses add column if not exists registration_accent text not null default '#4f46e5';

alter table public.courses drop constraint if exists courses_group_size_check;
alter table public.courses add constraint courses_group_size_check
  check (min_group_size between 2 and 100 and max_group_size between min_group_size and 100);

-- --------------------------------------------------------------------------
-- 2) แพ็กเกจของแต่ละคอร์ส เช่น 10 ชม. / 20 ชม. / รายปี / รายชั่วโมง
-- --------------------------------------------------------------------------
create table if not exists public.course_registration_packages (
  id uuid primary key default gen_random_uuid(),
  course_id bigint not null references public.courses(id) on delete cascade,
  package_code text not null,
  title text not null,
  description text not null default '',
  pricing_type text not null default 'fixed'
    check (pricing_type in ('fixed','hourly')),
  hours numeric(10,2) not null default 0 check (hours >= 0),
  price numeric(12,2) not null default 0 check (price >= 0),
  hourly_rate numeric(12,2) not null default 0 check (hourly_rate >= 0),
  min_hours numeric(10,2) not null default 1 check (min_hours > 0),
  max_hours numeric(10,2) not null default 100 check (max_hours >= min_hours),
  group_price_per_student numeric(12,2) check (group_price_per_student is null or group_price_per_student >= 0),
  allow_individual boolean not null default true,
  allow_group boolean not null default true,
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  auto_sync boolean not null default false,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(course_id, package_code)
);

alter table public.course_registration_packages add column if not exists auto_sync boolean not null default false;

create index if not exists course_registration_packages_course_idx
  on public.course_registration_packages(course_id,is_active,sort_order);

-- ทุกคอร์สมีแพ็กเกจเริ่มต้นอัตโนมัติ เพื่อให้คอร์สเดิมนำไปสมัครได้ทันที
insert into public.course_registration_packages(
  course_id,package_code,title,description,pricing_type,hours,price,
  allow_individual,allow_group,is_default,is_active,sort_order,auto_sync
)
select c.id,'DEFAULT',coalesce(nullif(c.course_type,''),'แพ็กเกจมาตรฐาน'),
       coalesce(c.public_description,c.description,''),'fixed',coalesce(c.hours,0),coalesce(c.price,0),
       coalesce(c.allow_individual,true),coalesce(c.allow_group,true),true,true,0,true
from public.courses c
where not exists (
  select 1 from public.course_registration_packages p where p.course_id=c.id
)
on conflict(course_id,package_code) do nothing;

-- --------------------------------------------------------------------------
-- 3) รอบเรียนที่เปิดรับจริง พร้อมจำนวนที่นั่ง
-- --------------------------------------------------------------------------
create table if not exists public.course_schedule_slots (
  id uuid primary key default gen_random_uuid(),
  course_id bigint not null references public.courses(id) on delete cascade,
  tutor_id uuid references public.tutor_directory(id) on delete set null,
  title text not null default '',
  day_of_week smallint check (day_of_week between 0 and 6),
  day_label text not null default '',
  start_time time not null,
  end_time time not null,
  start_date date,
  end_date date,
  recurrence_rule text not null default 'weekly',
  teaching_type text not null default 'ออนไลน์',
  location_or_link text not null default '',
  capacity integer not null default 1 check (capacity between 1 and 1000),
  enrollment_open boolean not null default true,
  is_active boolean not null default true,
  note text not null default '',
  auto_sync boolean not null default false,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  check (end_date is null or start_date is null or end_date >= start_date)
);

alter table public.course_schedule_slots add column if not exists auto_sync boolean not null default false;

create index if not exists course_schedule_slots_course_idx
  on public.course_schedule_slots(course_id,enrollment_open,is_active);
create index if not exists course_schedule_slots_tutor_idx
  on public.course_schedule_slots(tutor_id,day_of_week,start_time,end_time,is_active);
create unique index if not exists course_schedule_slots_auto_uidx
  on public.course_schedule_slots(course_id) where auto_sync=true;

alter table public.student_course_schedules
  add column if not exists schedule_slot_id uuid references public.course_schedule_slots(id) on delete set null;
alter table public.student_course_schedules
  add column if not exists seat_count integer not null default 1 check (seat_count between 1 and 100);
create index if not exists student_course_schedules_slot_idx
  on public.student_course_schedules(schedule_slot_id) where schedule_slot_id is not null;

-- สร้างรอบเริ่มต้นจากข้อมูลคอร์สเดิม เมื่อมีเวลาเริ่ม/สิ้นสุด
insert into public.course_schedule_slots(
  course_id,tutor_id,title,day_label,start_time,end_time,start_date,teaching_type,
  location_or_link,capacity,enrollment_open,is_active,note,auto_sync
)
select c.id,
       (select l.tutor_id from public.tutor_course_links l
        where l.course_id=c.id and l.is_active=true order by l.created_at limit 1),
       'รอบมาตรฐาน',coalesce(c.default_schedule_day,''),c.default_start_time,c.default_end_time,c.start_date,
       coalesce(c.default_teaching_type,'ออนไลน์'),coalesce(c.default_location_or_link,''),
       greatest(coalesce(c.capacity,1),1),coalesce(c.is_open_for_enrollment,false),true,'สร้างจากข้อมูลคอร์สเดิม',true
from public.courses c
where c.default_start_time is not null and c.default_end_time is not null
  and not exists(select 1 from public.course_schedule_slots s where s.course_id=c.id)
on conflict do nothing;

-- คอร์สที่เพิ่ม/แก้ในระบบหลักจะมีแพ็กเกจและรอบมาตรฐานในระบบรับสมัครโดยอัตโนมัติ
create or replace function private.v12_sync_course_registration_defaults()
returns trigger
language plpgsql
security definer
set search_path=''
as $$
declare v_tutor uuid;
begin
  insert into public.course_registration_packages(
    course_id,package_code,title,description,pricing_type,hours,price,
    allow_individual,allow_group,is_default,is_active,sort_order,auto_sync
  ) values (
    new.id,'DEFAULT',coalesce(nullif(new.course_type,''),'แพ็กเกจมาตรฐาน'),
    coalesce(new.public_description,new.description,''),'fixed',coalesce(new.hours,0),coalesce(new.price,0),
    coalesce(new.allow_individual,true),coalesce(new.allow_group,true),true,true,0,true
  )
  on conflict(course_id,package_code) do update set
    title=case when public.course_registration_packages.auto_sync then excluded.title else public.course_registration_packages.title end,
    description=case when public.course_registration_packages.auto_sync then excluded.description else public.course_registration_packages.description end,
    hours=case when public.course_registration_packages.auto_sync then excluded.hours else public.course_registration_packages.hours end,
    price=case when public.course_registration_packages.auto_sync then excluded.price else public.course_registration_packages.price end,
    allow_individual=case when public.course_registration_packages.auto_sync then excluded.allow_individual else public.course_registration_packages.allow_individual end,
    allow_group=case when public.course_registration_packages.auto_sync then excluded.allow_group else public.course_registration_packages.allow_group end,
    is_active=case when public.course_registration_packages.auto_sync then excluded.is_active else public.course_registration_packages.is_active end,
    updated_at=case when public.course_registration_packages.auto_sync then now() else public.course_registration_packages.updated_at end;

  select l.tutor_id into v_tutor from public.tutor_course_links l
  where l.course_id=new.id and l.is_active=true order by l.created_at limit 1;

  if new.default_start_time is not null and new.default_end_time is not null then
    insert into public.course_schedule_slots(
      course_id,tutor_id,title,day_label,start_time,end_time,start_date,teaching_type,
      location_or_link,capacity,enrollment_open,is_active,note,auto_sync
    ) values (
      new.id,v_tutor,'รอบมาตรฐาน',coalesce(new.default_schedule_day,''),new.default_start_time,new.default_end_time,
      new.start_date,coalesce(new.default_teaching_type,'ออนไลน์'),coalesce(new.default_location_or_link,''),
      greatest(coalesce(new.capacity,1),1),coalesce(new.is_open_for_enrollment,false),true,'ซิงก์จากคอร์สในระบบหลัก',true
    )
    on conflict(course_id) where auto_sync=true do update set
      tutor_id=excluded.tutor_id,day_label=excluded.day_label,start_time=excluded.start_time,end_time=excluded.end_time,
      start_date=excluded.start_date,teaching_type=excluded.teaching_type,location_or_link=excluded.location_or_link,
      capacity=excluded.capacity,enrollment_open=excluded.enrollment_open,is_active=true,note=excluded.note,updated_at=now();
  else
    update public.course_schedule_slots set enrollment_open=false,is_active=false,updated_at=now()
    where course_id=new.id and auto_sync=true;
  end if;
  return new;
end;
$$;

revoke all on function private.v12_sync_course_registration_defaults() from public,anon,authenticated;
drop trigger if exists trg_v12_sync_course_registration_defaults on public.courses;
create trigger trg_v12_sync_course_registration_defaults
after insert or update of title,course_type,hours,price,public_description,description,allow_individual,allow_group,
  default_schedule_day,default_start_time,default_end_time,start_date,default_teaching_type,
  default_location_or_link,capacity,is_open_for_enrollment
on public.courses for each row execute function private.v12_sync_course_registration_defaults();

-- --------------------------------------------------------------------------
-- 4) ใบสมัครและรายการคอร์สในใบสมัคร
-- --------------------------------------------------------------------------
create sequence if not exists public.student_application_code_seq start with 1001;

create or replace function public.generate_student_application_code()
returns text
language plpgsql
security definer
set search_path=''
as $$
declare v_code text;
begin
  loop
    v_code := 'REG' || to_char(current_date,'YYMM') || lpad(nextval('public.student_application_code_seq')::text,5,'0');
    exit when not exists(select 1 from public.student_applications a where a.application_code=v_code);
  end loop;
  return v_code;
end;
$$;

create table if not exists public.student_applications (
  id uuid primary key default gen_random_uuid(),
  application_code text not null unique default public.generate_student_application_code(),
  public_token uuid not null unique default gen_random_uuid(),
  application_type text not null default 'new'
    check (application_type in ('new','renewal')),
  status text not null default 'pending_review'
    check (status in ('payment_pending','pending_review','approved','rejected','withdrawn','expired')),

  student_code_claim text not null default '',
  title_name text not null default '',
  first_name text not null,
  last_name text not null,
  nickname text not null default '',
  phone text not null,
  phone_normalized text not null,
  email text not null default '',
  line_id text not null default '',
  school text not null default '',
  education_level text not null default '',
  province text not null default '',
  faculty text not null default '',
  address text not null default '',

  guardian_title text not null default '',
  guardian_name text not null default '',
  guardian_relationship text not null default '',
  guardian_phone text not null default '',
  guardian_line text not null default '',
  guardian_email text not null default '',

  study_type text not null default 'individual'
    check (study_type in ('individual','group')),
  group_size integer not null default 1 check (group_size between 1 and 100),
  additional_students jsonb not null default '[]'::jsonb check (jsonb_typeof(additional_students)='array'),
  learning_goal text not null default '',
  applicant_note text not null default '',

  payment_option text not null default 'full'
    check (payment_option in ('full','deposit','installment','pay_later')),
  installment_count integer not null default 1 check (installment_count between 1 and 36),
  payment_method text not null default 'PromptPay',
  total_list_price numeric(12,2) not null default 0 check (total_list_price >= 0),
  discount_code text not null default '',
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  total_due numeric(12,2) not null default 0 check (total_due >= 0),
  paid_amount_claimed numeric(12,2) not null default 0 check (paid_amount_claimed >= 0),
  payment_expires_at timestamptz,
  slip_storage_path text,
  slip_original_filename text not null default '',
  slip_submitted_at timestamptz,

  pdpa_accepted boolean not null default false,
  terms_version text not null default 'V12-2026-08',
  source text not null default 'register-subweb',
  student_id bigint references public.students(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text not null default '',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (discount_amount <= total_list_price),
  check (total_due = greatest(total_list_price-discount_amount,0)),
  check (paid_amount_claimed <= total_due)
);

create table if not exists public.student_application_items (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.student_applications(id) on delete cascade,
  course_id bigint not null references public.courses(id) on delete restrict,
  package_id uuid references public.course_registration_packages(id) on delete set null,
  tutor_id uuid references public.tutor_directory(id) on delete set null,
  schedule_slot_id uuid references public.course_schedule_slots(id) on delete set null,
  course_title_snapshot text not null,
  package_title_snapshot text not null default '',
  hours numeric(10,2) not null default 0 check (hours >= 0),
  list_price numeric(12,2) not null default 0 check (list_price >= 0),
  discount_amount numeric(12,2) not null default 0 check (discount_amount >= 0),
  final_price numeric(12,2) not null default 0 check (final_price >= 0),
  teaching_type text not null default 'ออนไลน์',
  schedule_day text not null default '',
  start_time time,
  end_time time,
  start_date date,
  location_or_link text not null default '',
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','cancelled')),
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(application_id,course_id,package_id),
  check (end_time is null or start_time is null or end_time > start_time),
  check (discount_amount <= list_price),
  check (final_price = greatest(list_price-discount_amount,0))
);

create index if not exists student_applications_status_idx
  on public.student_applications(status,created_at desc);
create index if not exists student_applications_phone_idx
  on public.student_applications(phone_normalized,created_at desc);
create index if not exists student_application_items_app_idx
  on public.student_application_items(application_id);
create index if not exists student_application_items_slot_idx
  on public.student_application_items(schedule_slot_id,status);

-- --------------------------------------------------------------------------
-- 5) โค้ดส่วนลด และคำขอจ้างวิทยากรจากหน้าเดียวกัน
-- --------------------------------------------------------------------------
create table if not exists public.registration_discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null default '',
  discount_type text not null default 'fixed'
    check (discount_type in ('fixed','percent')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  max_discount numeric(12,2),
  min_total numeric(12,2) not null default 0,
  usage_limit integer,
  used_count integer not null default 0,
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (usage_limit is null or usage_limit > 0),
  check (max_discount is null or max_discount > 0),
  check (valid_until is null or valid_from is null or valid_until > valid_from)
);

create table if not exists public.speaker_requests (
  id uuid primary key default gen_random_uuid(),
  request_code text not null unique default ('SPK'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  organization_name text not null,
  contact_name text not null,
  phone text not null,
  email text not null default '',
  event_title text not null,
  subject text not null default '',
  audience text not null default '',
  participant_count integer,
  event_date date,
  start_time time,
  end_time time,
  location text not null default '',
  budget numeric(12,2),
  detail text not null default '',
  status text not null default 'pending'
    check (status in ('pending','contacted','approved','rejected','completed','cancelled')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time is null or start_time is null or end_time > start_time)
);

-- --------------------------------------------------------------------------
-- 6) Helpers
-- --------------------------------------------------------------------------
create or replace function private.v12_normalize_phone(p_phone text)
returns text
language sql
immutable
set search_path=''
as $$ select regexp_replace(coalesce(p_phone,''),'\D','','g') $$;

create or replace function private.v12_valid_email(p_email text)
returns boolean
language sql
immutable
set search_path=''
as $$
  select coalesce(p_email,'')='' or lower(btrim(p_email)) ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
$$;

create or replace function private.v12_course_open(p_course_id bigint)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1 from public.courses c
    where c.id=p_course_id
      and c.is_active=true
      and c.is_published=true
      and c.approval_status='approved'
      and c.is_open_for_enrollment=true
      and (c.enrollment_deadline is null or c.enrollment_deadline>now())
  )
$$;

create or replace function private.v12_slot_reserved_count(p_slot_id uuid)
returns integer
language sql
stable
security definer
set search_path=''
as $$
  select (
    coalesce((select sum(s.seat_count) from public.student_course_schedules s
              where s.schedule_slot_id=p_slot_id and s.is_active=true),0)
    +
    coalesce((select sum(a.group_size) from public.student_application_items i
              join public.student_applications a on a.id=i.application_id
              where i.schedule_slot_id=p_slot_id and i.status='pending'
                and a.status in ('payment_pending','pending_review')
                and (a.status<>'payment_pending' or a.payment_expires_at is null or a.payment_expires_at>now())),0)
  )::integer
$$;

create or replace function private.v12_valid_registration_upload_token(p_token text)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1 from public.student_applications a
    where a.public_token::text=p_token
      and a.status in ('payment_pending','pending_review')
      and a.created_at>now()-interval '30 days'
  )
$$;

revoke all on function public.generate_student_application_code() from public,anon,authenticated;
revoke all on function private.v12_normalize_phone(text) from public;
revoke all on function private.v12_valid_email(text) from public;
revoke all on function private.v12_course_open(bigint) from public;
revoke all on function private.v12_slot_reserved_count(uuid) from public;
revoke all on function private.v12_valid_registration_upload_token(text) from public;
grant execute on function private.v12_valid_registration_upload_token(text) to anon,authenticated,service_role;

-- --------------------------------------------------------------------------
-- 7) Public API: โหลดคอร์ส/ครู/รอบเรียนจากระบบหลัก
-- --------------------------------------------------------------------------
create or replace function public.public_registration_v12_bootstrap()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  return jsonb_build_object(
    'config',jsonb_build_object(
      'brand','กวดวิชาชีววิทยา อาวริน',
      'promptpay_id','1901001151577',
      'payee_name','กวดวิชาชีววิทยา อาวริน',
      'payment_minutes',15,
      'terms_version','V12-2026-08'
    ),
    'courses',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',c.id,'course_code',c.course_code,'title',c.title,'description',c.description,
        'public_description',c.public_description,'subject_name',c.subject_name,
        'target_levels',c.target_levels,'course_type',c.course_type,'hours',c.hours,'price',c.price,
        'cover_url',c.cover_url,'intro_video_url',c.intro_video_url,
        'registration_summary',c.registration_summary,'registration_requirements',c.registration_requirements,
        'allow_individual',c.allow_individual,'allow_group',c.allow_group,
        'min_group_size',c.min_group_size,'max_group_size',c.max_group_size,
        'accent',c.registration_accent,'enrollment_deadline',c.enrollment_deadline,
        'default_teaching_type',c.default_teaching_type
      ) order by c.registration_sort_order,c.title)
      from public.courses c
      where private.v12_course_open(c.id)
    ),'[]'::jsonb),
    'packages',coalesce((
      select jsonb_agg(to_jsonb(p) order by p.course_id,p.sort_order,p.title)
      from public.course_registration_packages p
      where p.is_active=true and private.v12_course_open(p.course_id)
    ),'[]'::jsonb),
    'tutors',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',d.id,'tutor_code',d.tutor_code,'display_name',d.display_name,'nickname',d.nickname,
        'primary_subject',d.primary_subject,'subjects',d.subjects,'bio',d.bio,'avatar_url',d.avatar_url
      ) order by d.display_name)
      from public.tutor_directory d
      where d.is_active=true and d.account_status<>'archived'
        and exists(select 1 from public.tutor_course_links l where l.tutor_id=d.id and l.is_active=true and private.v12_course_open(l.course_id))
    ),'[]'::jsonb),
    'tutor_courses',coalesce((
      select jsonb_agg(jsonb_build_object('tutor_id',l.tutor_id,'course_id',l.course_id))
      from public.tutor_course_links l
      where l.is_active=true and private.v12_course_open(l.course_id)
    ),'[]'::jsonb),
    'slots',coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',s.id,'course_id',s.course_id,'tutor_id',s.tutor_id,'title',s.title,
        'day_of_week',s.day_of_week,'day_label',s.day_label,'start_time',s.start_time,
        'end_time',s.end_time,'start_date',s.start_date,'end_date',s.end_date,
        'teaching_type',s.teaching_type,'location_or_link',s.location_or_link,
        'capacity',s.capacity,'reserved',private.v12_slot_reserved_count(s.id),
        'remaining',greatest(s.capacity-private.v12_slot_reserved_count(s.id),0),
        'note',s.note
      ) order by s.course_id,s.day_of_week nulls last,s.start_time)
      from public.course_schedule_slots s
      where s.is_active=true and s.enrollment_open=true and private.v12_course_open(s.course_id)
        and (s.end_date is null or s.end_date>=current_date)
    ),'[]'::jsonb)
  );
end;
$$;

-- --------------------------------------------------------------------------
-- 8) Public API: ตรวจโค้ดส่วนลด
-- --------------------------------------------------------------------------
create or replace function public.public_registration_v12_check_discount(
  p_code text,
  p_total numeric
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare v_code public.registration_discount_codes; v_discount numeric:=0;
begin
  select * into v_code from public.registration_discount_codes d
  where upper(d.code)=upper(btrim(coalesce(p_code,'')))
    and d.is_active=true
    and (d.valid_from is null or d.valid_from<=now())
    and (d.valid_until is null or d.valid_until>now())
    and (d.usage_limit is null or d.used_count<d.usage_limit)
  limit 1;
  if v_code.id is null then return jsonb_build_object('valid',false,'message','ไม่พบโค้ดส่วนลดหรือโค้ดหมดอายุ'); end if;
  if coalesce(p_total,0)<v_code.min_total then
    return jsonb_build_object('valid',false,'message','ยอดสมัครยังไม่ถึงขั้นต่ำของโค้ดนี้');
  end if;
  if v_code.discount_type='percent' then
    v_discount:=round(coalesce(p_total,0)*v_code.discount_value/100,2);
    if v_code.max_discount is not null then v_discount:=least(v_discount,v_code.max_discount); end if;
  else v_discount:=v_code.discount_value; end if;
  v_discount:=least(v_discount,coalesce(p_total,0));
  return jsonb_build_object('valid',true,'title',v_code.title,'amount',v_discount,'code',v_code.code);
end;
$$;

-- --------------------------------------------------------------------------
-- 9) Public API: ส่งใบสมัคร (ราคา/ที่นั่งตรวจจากฐานข้อมูล ไม่เชื่อค่าจาก Browser)
-- --------------------------------------------------------------------------
create or replace function public.public_registration_v12_submit(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_app public.student_applications;
  v_item jsonb;
  v_course public.courses;
  v_package public.course_registration_packages;
  v_tutor public.tutor_directory;
  v_slot public.course_schedule_slots;
  v_phone text:=private.v12_normalize_phone(p_payload->>'phone');
  v_email text:=lower(btrim(coalesce(p_payload->>'email','')));
  v_study_type text:=coalesce(nullif(p_payload->>'study_type',''),'individual');
  v_group_size integer:=greatest(1,least(coalesce(nullif(p_payload->>'group_size','')::integer,1),100));
  v_list numeric:=0;
  v_discount numeric:=0;
  v_price numeric;
  v_hours numeric;
  v_selected_hours numeric;
  v_code public.registration_discount_codes;
  v_claimed numeric:=greatest(coalesce(nullif(p_payload->>'paid_amount_claimed','')::numeric,0),0);
  v_payment_option text:=coalesce(nullif(p_payload->>'payment_option',''),'full');
  v_item_count integer:=0;
  v_duplicate boolean:=false;
  v_allocated numeric:=0;
  v_row public.student_application_items;
  v_existing_student_id bigint;
begin
  if length(v_phone) not between 9 and 10 then raise exception 'กรุณากรอกเบอร์โทรให้ถูกต้อง'; end if;
  if not private.v12_valid_email(v_email) then raise exception 'กรุณากรอกอีเมลให้ถูกต้อง'; end if;
  if btrim(coalesce(p_payload->>'first_name',''))='' or btrim(coalesce(p_payload->>'last_name',''))='' then
    raise exception 'กรุณากรอกชื่อและนามสกุล';
  end if;
  if coalesce((p_payload->>'pdpa_accepted')::boolean,false)=false then raise exception 'กรุณายอมรับเงื่อนไขและนโยบาย'; end if;
  if v_study_type not in ('individual','group') then raise exception 'รูปแบบการเรียนไม่ถูกต้อง'; end if;
  if v_study_type='group' and v_group_size<2 then raise exception 'การเรียนกลุ่มต้องมีอย่างน้อย 2 คน'; end if;
  if coalesce(jsonb_typeof(p_payload->'items'),'')<>'array' or coalesce(jsonb_array_length(p_payload->'items'),0)=0 then raise exception 'กรุณาเลือกคอร์ส'; end if;
  if jsonb_array_length(p_payload->'items')>8 then raise exception 'เลือกได้สูงสุด 8 รายการต่อใบสมัคร'; end if;
  if coalesce(nullif(p_payload->>'application_type',''),'new') not in ('new','renewal') then raise exception 'ประเภทใบสมัครไม่ถูกต้อง'; end if;

  if coalesce(nullif(p_payload->>'application_type',''),'new')='renewal' then
    if btrim(coalesce(p_payload->>'student_code_claim',''))='' then raise exception 'กรุณากรอก Student ID เดิม'; end if;
    select s.id into v_existing_student_id from public.students s
    where upper(s.student_code)=upper(btrim(p_payload->>'student_code_claim'))
      and private.v9_normalize_phone(s.phone)=v_phone
      and coalesce(s.is_archived,false)=false
    order by s.id limit 1;
    if v_existing_student_id is null then raise exception 'Student ID หรือเบอร์โทรไม่ตรงกับข้อมูลนักเรียนเดิม'; end if;
  end if;

  -- ป้องกันเลือกรอบเรียนในใบสมัครเดียวกันที่เวลาชนกัน
  if exists(
    with chosen as (
      select x.ord, nullif(x.value->>'schedule_slot_id','')::uuid as slot_id
      from jsonb_array_elements(p_payload->'items') with ordinality as x(value,ord)
    )
    select 1 from chosen a
    join chosen b on a.ord<b.ord and a.slot_id is not null and b.slot_id is not null
    join public.course_schedule_slots sa on sa.id=a.slot_id
    join public.course_schedule_slots sb on sb.id=b.slot_id
    where sa.day_of_week is not null and sa.day_of_week=sb.day_of_week
      and sa.start_time<sb.end_time and sb.start_time<sa.end_time
  ) then raise exception 'รอบเรียนที่เลือกมีเวลาเรียนชนกัน'; end if;

  -- นักเรียนเดิมต้องไม่เลือกรอบที่ชนกับตารางเรียนปัจจุบัน
  if v_existing_student_id is not null and exists(
    with chosen as (
      select nullif(x.value->>'schedule_slot_id','')::uuid as slot_id
      from jsonb_array_elements(p_payload->'items') x(value)
    )
    select 1 from chosen c
    join public.course_schedule_slots ns on ns.id=c.slot_id
    join public.student_course_schedules es on es.student_id=v_existing_student_id and es.is_active=true
    where ns.day_label<>'' and es.schedule_day<>'' and lower(ns.day_label)=lower(es.schedule_day)
      and ns.start_time<es.end_time and es.start_time<ns.end_time
  ) then raise exception 'รอบที่เลือกชนกับตารางเรียนเดิมของนักเรียน'; end if;

  -- ป้องกันส่งซ้ำในช่วงสั้นสำหรับเบอร์และคอร์สชุดเดียวกัน
  select exists(
    select 1 from public.student_applications a
    where a.phone_normalized=v_phone
      and a.status in ('payment_pending','pending_review')
      and (a.status<>'payment_pending' or a.payment_expires_at is null or a.payment_expires_at>now())
      and a.created_at>now()-interval '10 minutes'
  ) into v_duplicate;
  if v_duplicate then raise exception 'มีใบสมัครล่าสุดของเบอร์นี้อยู่แล้ว กรุณาใช้เมนูเช็กสถานะ'; end if;

  -- ตรวจรายการและรวมราคาจริง
  for v_item in select value from jsonb_array_elements(p_payload->'items') loop
    v_item_count:=v_item_count+1;
    select * into v_course from public.courses c where c.id=(v_item->>'course_id')::bigint for share;
    if v_course.id is null or not private.v12_course_open(v_course.id) then raise exception 'คอร์สที่เลือกไม่ได้เปิดรับสมัครแล้ว'; end if;

    select * into v_package from public.course_registration_packages p
    where p.id=nullif(v_item->>'package_id','')::uuid and p.course_id=v_course.id and p.is_active=true;
    if v_package.id is null then
      select * into v_package from public.course_registration_packages p
      where p.course_id=v_course.id and p.is_active=true order by p.is_default desc,p.sort_order,p.created_at limit 1;
    end if;
    if v_package.id is null then raise exception 'คอร์สนี้ยังไม่มีแพ็กเกจที่เปิดรับ'; end if;
    if v_study_type='individual' and (not v_course.allow_individual or not v_package.allow_individual) then raise exception 'แพ็กเกจนี้ไม่เปิดเรียนเดี่ยว'; end if;
    if v_study_type='group' and (not v_course.allow_group or not v_package.allow_group) then raise exception 'แพ็กเกจนี้ไม่เปิดเรียนกลุ่ม'; end if;
    if v_study_type='group' and (v_group_size<v_course.min_group_size or v_group_size>v_course.max_group_size) then raise exception 'จำนวนผู้เรียนกลุ่มไม่อยู่ในช่วงที่คอร์สกำหนด'; end if;

    if v_package.pricing_type='hourly' then
      v_selected_hours:=coalesce(nullif(v_item->>'selected_hours','')::numeric,v_package.min_hours);
      if v_selected_hours<v_package.min_hours or v_selected_hours>v_package.max_hours then raise exception 'จำนวนชั่วโมงรายชั่วโมงไม่ถูกต้อง'; end if;
      v_hours:=v_selected_hours;
      v_price:=v_selected_hours*v_package.hourly_rate*(case when v_study_type='group' then v_group_size else 1 end);
    else
      v_hours:=v_package.hours;
      v_price:=(case when v_study_type='group' and v_package.group_price_per_student is not null
                    then v_package.group_price_per_student else v_package.price end)
                    *(case when v_study_type='group' then v_group_size else 1 end);
    end if;

    if nullif(v_item->>'tutor_id','') is not null then
      select * into v_tutor from public.tutor_directory d where d.id=(v_item->>'tutor_id')::uuid and d.is_active=true;
      if v_tutor.id is null or not exists(select 1 from public.tutor_course_links l where l.tutor_id=v_tutor.id and l.course_id=v_course.id and l.is_active=true) then
        raise exception 'ติวเตอร์ที่เลือกไม่ได้สอนคอร์สนี้';
      end if;
    else v_tutor:=null; end if;

    if nullif(v_item->>'schedule_slot_id','') is not null then
      select * into v_slot from public.course_schedule_slots s where s.id=(v_item->>'schedule_slot_id')::uuid for update;
      if v_slot.id is null or v_slot.course_id<>v_course.id or not v_slot.is_active or not v_slot.enrollment_open then raise exception 'รอบเรียนที่เลือกไม่พร้อมรับสมัคร'; end if;
      if v_tutor.id is not null and v_slot.tutor_id is not null and v_slot.tutor_id<>v_tutor.id then raise exception 'รอบเรียนไม่ตรงกับติวเตอร์ที่เลือก'; end if;
      if private.v12_slot_reserved_count(v_slot.id)+v_group_size>v_slot.capacity then raise exception 'รอบเรียนนี้มีที่นั่งไม่พอ กรุณาเลือกรอบอื่น'; end if;
    else v_slot:=null; end if;

    v_list:=v_list+v_price;
  end loop;

  -- คำนวณส่วนลดจากฐานข้อมูล
  if btrim(coalesce(p_payload->>'discount_code',''))<>'' then
    select * into v_code from public.registration_discount_codes d
    where upper(d.code)=upper(btrim(p_payload->>'discount_code')) and d.is_active=true
      and (d.valid_from is null or d.valid_from<=now()) and (d.valid_until is null or d.valid_until>now())
      and (d.usage_limit is null or d.used_count<d.usage_limit) and v_list>=d.min_total
    for update;
    if v_code.id is null then raise exception 'โค้ดส่วนลดไม่ถูกต้องหรือหมดอายุ'; end if;
    if v_code.discount_type='percent' then
      v_discount:=round(v_list*v_code.discount_value/100,2);
      if v_code.max_discount is not null then v_discount:=least(v_discount,v_code.max_discount); end if;
    else v_discount:=v_code.discount_value; end if;
    v_discount:=least(v_discount,v_list);
  end if;

  if v_claimed>greatest(v_list-v_discount,0) then raise exception 'ยอดที่แจ้งชำระมากกว่ายอดสุทธิ'; end if;
  if v_payment_option not in ('full','deposit','installment','pay_later') then raise exception 'รูปแบบการชำระไม่ถูกต้อง'; end if;

  insert into public.student_applications(
    application_type,status,student_code_claim,title_name,first_name,last_name,nickname,
    phone,phone_normalized,email,line_id,school,education_level,province,faculty,address,
    guardian_title,guardian_name,guardian_relationship,guardian_phone,guardian_line,guardian_email,
    study_type,group_size,additional_students,learning_goal,applicant_note,payment_option,installment_count,payment_method,
    total_list_price,discount_code,discount_amount,total_due,paid_amount_claimed,payment_expires_at,
    pdpa_accepted,terms_version
  ) values (
    coalesce(nullif(p_payload->>'application_type',''),'new'),
    case when v_payment_option='pay_later' or greatest(v_list-v_discount,0)=0 then 'pending_review' else 'payment_pending' end,
    coalesce(p_payload->>'student_code_claim',''),coalesce(p_payload->>'title_name',''),btrim(p_payload->>'first_name'),btrim(p_payload->>'last_name'),coalesce(p_payload->>'nickname',''),
    coalesce(p_payload->>'phone',''),v_phone,v_email,coalesce(p_payload->>'line_id',''),coalesce(p_payload->>'school',''),coalesce(p_payload->>'education_level',''),coalesce(p_payload->>'province',''),coalesce(p_payload->>'faculty',''),coalesce(p_payload->>'address',''),
    coalesce(p_payload->>'guardian_title',''),coalesce(p_payload->>'guardian_name',''),coalesce(p_payload->>'guardian_relationship',''),coalesce(p_payload->>'guardian_phone',''),coalesce(p_payload->>'guardian_line',''),lower(coalesce(p_payload->>'guardian_email','')),
    v_study_type,v_group_size,case when jsonb_typeof(p_payload->'additional_students')='array' then p_payload->'additional_students' else '[]'::jsonb end,coalesce(p_payload->>'learning_goal',''),coalesce(p_payload->>'applicant_note',''),v_payment_option,
    greatest(1,least(coalesce(nullif(p_payload->>'installment_count','')::integer,1),36)),coalesce(nullif(p_payload->>'payment_method',''),'PromptPay'),
    v_list,coalesce(v_code.code,''),v_discount,greatest(v_list-v_discount,0),v_claimed,
    case when v_payment_option='pay_later' or greatest(v_list-v_discount,0)=0 then null else now()+interval '15 minutes' end,
    true,coalesce(nullif(p_payload->>'terms_version',''),'V12-2026-08')
  ) returning * into v_app;

  -- บันทึกรายการรอบที่สองด้วยข้อมูล Snapshot และจัดสรรส่วนลดตามสัดส่วน
  for v_item in select value from jsonb_array_elements(p_payload->'items') loop
    select * into v_course from public.courses where id=(v_item->>'course_id')::bigint;
    select * into v_package from public.course_registration_packages p
      where p.id=nullif(v_item->>'package_id','')::uuid and p.course_id=v_course.id and p.is_active=true;
    if v_package.id is null then select * into v_package from public.course_registration_packages p where p.course_id=v_course.id and p.is_active=true order by p.is_default desc,p.sort_order,p.created_at limit 1; end if;
    if v_package.pricing_type='hourly' then
      v_hours:=coalesce(nullif(v_item->>'selected_hours','')::numeric,v_package.min_hours);
      v_price:=v_hours*v_package.hourly_rate*(case when v_study_type='group' then v_group_size else 1 end);
    else
      v_hours:=v_package.hours;
      v_price:=(case when v_study_type='group' and v_package.group_price_per_student is not null then v_package.group_price_per_student else v_package.price end)
               *(case when v_study_type='group' then v_group_size else 1 end);
    end if;
    if nullif(v_item->>'tutor_id','') is not null then select * into v_tutor from public.tutor_directory where id=(v_item->>'tutor_id')::uuid; else v_tutor:=null; end if;
    if nullif(v_item->>'schedule_slot_id','') is not null then select * into v_slot from public.course_schedule_slots where id=(v_item->>'schedule_slot_id')::uuid; else v_slot:=null; end if;

    insert into public.student_application_items(
      application_id,course_id,package_id,tutor_id,schedule_slot_id,course_title_snapshot,package_title_snapshot,
      hours,list_price,discount_amount,final_price,teaching_type,schedule_day,start_time,end_time,start_date,location_or_link,note
    ) values (
      v_app.id,v_course.id,v_package.id,v_tutor.id,v_slot.id,v_course.title,v_package.title,
      v_hours,v_price,
      case when v_list>0 then round(v_discount*v_price/v_list,2) else 0 end,
      greatest(v_price-(case when v_list>0 then round(v_discount*v_price/v_list,2) else 0 end),0),
      coalesce(v_slot.teaching_type,v_course.default_teaching_type,'ออนไลน์'),
      coalesce(v_slot.day_label,v_course.default_schedule_day,''),coalesce(v_slot.start_time,v_course.default_start_time),coalesce(v_slot.end_time,v_course.default_end_time),
      coalesce(v_slot.start_date,v_course.start_date,current_date),coalesce(v_slot.location_or_link,v_course.default_location_or_link,''),coalesce(v_item->>'note','')
    ) returning * into v_row;
    v_allocated:=v_allocated+v_row.discount_amount;
  end loop;

  -- ปรับเศษสตางค์ของส่วนลดไปยังรายการสุดท้าย ให้ผลรวมตรง 100%
  if v_discount<>v_allocated then
    update public.student_application_items i set
      discount_amount=greatest(i.discount_amount+(v_discount-v_allocated),0),
      final_price=greatest(i.list_price-(greatest(i.discount_amount+(v_discount-v_allocated),0)),0),
      updated_at=now()
    where i.id=(select x.id from public.student_application_items x where x.application_id=v_app.id order by x.created_at desc limit 1);
  end if;

  if v_code.id is not null then update public.registration_discount_codes set used_count=used_count+1,updated_at=now() where id=v_code.id; end if;

  insert into public.portal_notifications(audience,notification_type,title,body,entity_type,entity_id,dedupe_key)
  values('admin','public_student_application','มีใบสมัครนักเรียนใหม่',
    v_app.application_code||' · '||v_app.first_name||' '||v_app.last_name||' · '||v_item_count||' คอร์ส',
    'student_application',v_app.id::text,'student_application:'||v_app.id::text)
  on conflict(dedupe_key) do nothing;

  return jsonb_build_object(
    'application_id',v_app.id,'application_code',v_app.application_code,'public_token',v_app.public_token,
    'status',v_app.status,'total_list_price',v_app.total_list_price,'discount_amount',v_app.discount_amount,
    'total_due',v_app.total_due,'payment_expires_at',v_app.payment_expires_at,
    'promptpay_id','1901001151577','payee_name','กวดวิชาชีววิทยา อาวริน'
  );
end;
$$;

-- แนบสลิปหลังสร้างใบสมัคร
create or replace function public.public_registration_v12_attach_slip(
  p_public_token uuid,
  p_storage_path text,
  p_original_filename text,
  p_paid_amount numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_app public.student_applications;
begin
  select * into v_app from public.student_applications a where a.public_token=p_public_token for update;
  if v_app.id is null then raise exception 'ไม่พบใบสมัคร'; end if;
  if v_app.status not in ('payment_pending','pending_review') then raise exception 'ใบสมัครนี้ไม่สามารถแนบสลิปได้'; end if;
  if p_storage_path is null or p_storage_path not like p_public_token::text||'/%' then raise exception 'ตำแหน่งสลิปไม่ถูกต้อง'; end if;
  if p_paid_amount is not null and (p_paid_amount<0 or p_paid_amount>v_app.total_due) then raise exception 'ยอดชำระไม่ถูกต้อง'; end if;
  update public.student_applications set
    slip_storage_path=p_storage_path,slip_original_filename=coalesce(p_original_filename,''),
    slip_submitted_at=now(),paid_amount_claimed=coalesce(p_paid_amount,paid_amount_claimed),
    status='pending_review',updated_at=now()
  where id=v_app.id returning * into v_app;
  insert into public.portal_notifications(audience,notification_type,title,body,entity_type,entity_id,dedupe_key)
  values('admin','public_registration_slip','มีสลิปใบสมัครใหม่',v_app.application_code||' · '||v_app.first_name||' '||v_app.last_name,
    'student_application',v_app.id::text,'student_application_slip:'||v_app.id::text)
  on conflict(dedupe_key) do update set body=excluded.body,created_at=now(),is_read=false,read_at=null;
  return jsonb_build_object('application_code',v_app.application_code,'status',v_app.status,'slip_submitted_at',v_app.slip_submitted_at);
end;
$$;

-- เช็กสถานะโดยใช้เบอร์ + เลขใบสมัคร
create or replace function public.public_registration_v12_check_status(p_phone text,p_application_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare v_app public.student_applications; v_items jsonb;
begin
  select * into v_app from public.student_applications a
  where a.phone_normalized=private.v12_normalize_phone(p_phone)
    and upper(a.application_code)=upper(btrim(coalesce(p_application_code,'')))
  order by a.created_at desc limit 1;
  if v_app.id is null then return jsonb_build_object('found',false); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'course',i.course_title_snapshot,'package',i.package_title_snapshot,'tutor',coalesce(d.display_name,'รอจัดผู้สอน'),
    'schedule',trim(concat_ws(' ',nullif(i.schedule_day,''),to_char(i.start_time,'HH24:MI'),case when i.end_time is not null then '-'||to_char(i.end_time,'HH24:MI') else null end)),
    'status',i.status
  ) order by i.created_at),'[]'::jsonb)
  into v_items
  from public.student_application_items i left join public.tutor_directory d on d.id=i.tutor_id where i.application_id=v_app.id;
  return jsonb_build_object(
    'found',true,'application_code',v_app.application_code,
    'name',v_app.first_name||' '||left(v_app.last_name,1)||'.','status',v_app.status,
    'created_at',v_app.created_at,'reviewed_at',v_app.reviewed_at,'review_note',v_app.review_note,
    'student_code',(select s.student_code from public.students s where s.id=v_app.student_id),
    'total_due',v_app.total_due,'paid_amount_claimed',v_app.paid_amount_claimed,
    'payment_expires_at',v_app.payment_expires_at,'has_slip',v_app.slip_storage_path is not null,
    'items',v_items
  );
end;
$$;

-- จ้างวิทยากร
create or replace function public.public_registration_v12_submit_speaker_request(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_row public.speaker_requests; v_phone text:=private.v12_normalize_phone(p_payload->>'phone');
begin
  if btrim(coalesce(p_payload->>'organization_name',''))='' or btrim(coalesce(p_payload->>'contact_name',''))='' then raise exception 'กรุณากรอกหน่วยงานและผู้ติดต่อ'; end if;
  if length(v_phone) not between 9 and 10 then raise exception 'เบอร์โทรไม่ถูกต้อง'; end if;
  if btrim(coalesce(p_payload->>'event_title',''))='' then raise exception 'กรุณากรอกหัวข้องาน'; end if;
  insert into public.speaker_requests(
    organization_name,contact_name,phone,email,event_title,subject,audience,participant_count,event_date,start_time,end_time,location,budget,detail
  ) values (
    btrim(p_payload->>'organization_name'),btrim(p_payload->>'contact_name'),coalesce(p_payload->>'phone',''),lower(coalesce(p_payload->>'email','')),
    btrim(p_payload->>'event_title'),coalesce(p_payload->>'subject',''),coalesce(p_payload->>'audience',''),nullif(p_payload->>'participant_count','')::integer,
    nullif(p_payload->>'event_date','')::date,nullif(p_payload->>'start_time','')::time,nullif(p_payload->>'end_time','')::time,
    coalesce(p_payload->>'location',''),nullif(p_payload->>'budget','')::numeric,coalesce(p_payload->>'detail','')
  ) returning * into v_row;
  insert into public.portal_notifications(audience,notification_type,title,body,entity_type,entity_id,dedupe_key)
  values('admin','speaker_request','มีคำขอจ้างวิทยากร',v_row.organization_name||' · '||v_row.event_title,'speaker_request',v_row.id::text,'speaker_request:'||v_row.id::text)
  on conflict(dedupe_key) do nothing;
  return jsonb_build_object('request_code',v_row.request_code,'status',v_row.status);
end;
$$;

-- --------------------------------------------------------------------------
-- 10) Admin API: Dashboard, แพ็กเกจ, รอบเรียน, ส่วนลด และอนุมัติ
-- --------------------------------------------------------------------------
create or replace function public.admin_v12_registration_bootstrap()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
begin
  if not private.v8_is_admin() then raise exception 'เฉพาะแอดมินเท่านั้น' using errcode='42501'; end if;
  return jsonb_build_object(
    'applications',coalesce((select jsonb_agg(to_jsonb(a) order by a.created_at desc) from (select * from public.student_applications order by created_at desc limit 500) a),'[]'::jsonb),
    'application_items',coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at) from public.student_application_items i where exists(select 1 from public.student_applications a where a.id=i.application_id and a.created_at>now()-interval '2 years')),'[]'::jsonb),
    'courses',coalesce((select jsonb_agg(to_jsonb(c) order by c.registration_sort_order,c.title) from public.courses c),'[]'::jsonb),
    'tutors',coalesce((select jsonb_agg(to_jsonb(d) order by d.display_name) from public.tutor_directory d),'[]'::jsonb),
    'tutor_courses',coalesce((select jsonb_agg(to_jsonb(l)) from public.tutor_course_links l),'[]'::jsonb),
    'packages',coalesce((select jsonb_agg(to_jsonb(p) order by p.course_id,p.sort_order,p.title) from public.course_registration_packages p),'[]'::jsonb),
    'slots',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('reserved',private.v12_slot_reserved_count(s.id),'remaining',greatest(s.capacity-private.v12_slot_reserved_count(s.id),0)) order by s.course_id,s.start_time) from public.course_schedule_slots s),'[]'::jsonb),
    'discounts',coalesce((select jsonb_agg(to_jsonb(d) order by d.created_at desc) from public.registration_discount_codes d),'[]'::jsonb),
    'speaker_requests',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from (select * from public.speaker_requests order by created_at desc limit 300) r),'[]'::jsonb)
  );
end;
$$;


create or replace function public.admin_v12_update_course_registration(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id bigint:=nullif(p_payload->>'course_id','')::bigint;
  v_row public.courses;
  v_levels text[]:='{}'::text[];
  v_tutors uuid[]:='{}'::uuid[];
  v_tid uuid;
begin
  if not private.v8_is_admin() then raise exception 'เฉพาะแอดมินเท่านั้น' using errcode='42501'; end if;
  if v_id is null then raise exception 'กรุณาเลือกคอร์ส'; end if;
  if jsonb_typeof(p_payload->'target_levels')='array' then
    select coalesce(array_agg(btrim(value)) filter(where btrim(value)<>''),'{}'::text[]) into v_levels
    from jsonb_array_elements_text(p_payload->'target_levels') x(value);
  else
    select coalesce(array_agg(btrim(value)) filter(where btrim(value)<>''),'{}'::text[]) into v_levels
    from unnest(regexp_split_to_array(coalesce(p_payload->>'target_levels',''),E'\\s*,\\s*')) x(value);
  end if;
  update public.courses set
    subject_name=coalesce(p_payload->>'subject_name',''),target_levels=v_levels,
    registration_summary=coalesce(p_payload->>'registration_summary',''),
    registration_requirements=coalesce(p_payload->>'registration_requirements',''),
    intro_video_url=coalesce(p_payload->>'intro_video_url',''),
    allow_individual=coalesce((p_payload->>'allow_individual')::boolean,allow_individual),
    allow_group=coalesce((p_payload->>'allow_group')::boolean,allow_group),
    min_group_size=greatest(2,coalesce(nullif(p_payload->>'min_group_size','')::integer,min_group_size)),
    max_group_size=greatest(greatest(2,coalesce(nullif(p_payload->>'min_group_size','')::integer,min_group_size)),coalesce(nullif(p_payload->>'max_group_size','')::integer,max_group_size)),
    registration_sort_order=coalesce(nullif(p_payload->>'registration_sort_order','')::integer,registration_sort_order),
    registration_accent=coalesce(nullif(p_payload->>'registration_accent',''),registration_accent),
    is_open_for_enrollment=coalesce((p_payload->>'is_open_for_enrollment')::boolean,is_open_for_enrollment),
    enrollment_deadline=nullif(p_payload->>'enrollment_deadline','')::timestamptz,
    updated_at=now()
  where id=v_id returning * into v_row;
  if v_row.id is null then raise exception 'ไม่พบคอร์ส'; end if;

  if jsonb_typeof(p_payload->'tutor_ids')='array' then
    select coalesce(array_agg(value::uuid),'{}'::uuid[]) into v_tutors
    from jsonb_array_elements_text(p_payload->'tutor_ids') x(value)
    where nullif(value,'') is not null;
    update public.tutor_course_links set is_active=false,updated_at=now()
    where course_id=v_id and not (tutor_id=any(v_tutors));
    foreach v_tid in array v_tutors loop
      insert into public.tutor_course_links(tutor_id,course_id,is_active,assigned_by)
      values(v_tid,v_id,true,auth.uid())
      on conflict(tutor_id,course_id) do update set is_active=true,assigned_by=auth.uid(),updated_at=now();
    end loop;
    update public.course_schedule_slots
    set tutor_id=case when cardinality(v_tutors)>0 then v_tutors[1] else null end,updated_at=now()
    where course_id=v_id and auto_sync=true;
  end if;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.admin_v12_save_registration_package(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_id uuid:=nullif(p_payload->>'id','')::uuid; v_row public.course_registration_packages;
begin
  if not private.v8_is_admin() then raise exception 'เฉพาะแอดมินเท่านั้น' using errcode='42501'; end if;
  if nullif(p_payload->>'course_id','') is null then raise exception 'กรุณาเลือกคอร์ส'; end if;
  if btrim(coalesce(p_payload->>'title',''))='' then raise exception 'กรุณากรอกชื่อแพ็กเกจ'; end if;
  if v_id is null then
    insert into public.course_registration_packages(
      course_id,package_code,title,description,pricing_type,hours,price,hourly_rate,min_hours,max_hours,
      group_price_per_student,allow_individual,allow_group,is_default,is_active,sort_order,auto_sync
    ) values (
      (p_payload->>'course_id')::bigint,upper(coalesce(nullif(btrim(p_payload->>'package_code'),''),'PKG-'||substr(gen_random_uuid()::text,1,6))),
      btrim(p_payload->>'title'),coalesce(p_payload->>'description',''),coalesce(nullif(p_payload->>'pricing_type',''),'fixed'),
      coalesce(nullif(p_payload->>'hours','')::numeric,0),coalesce(nullif(p_payload->>'price','')::numeric,0),coalesce(nullif(p_payload->>'hourly_rate','')::numeric,0),
      coalesce(nullif(p_payload->>'min_hours','')::numeric,1),coalesce(nullif(p_payload->>'max_hours','')::numeric,100),nullif(p_payload->>'group_price_per_student','')::numeric,
      coalesce((p_payload->>'allow_individual')::boolean,true),coalesce((p_payload->>'allow_group')::boolean,true),
      coalesce((p_payload->>'is_default')::boolean,false),coalesce((p_payload->>'is_active')::boolean,true),coalesce(nullif(p_payload->>'sort_order','')::integer,0),false
    ) returning * into v_row;
  else
    update public.course_registration_packages set
      package_code=upper(coalesce(nullif(btrim(p_payload->>'package_code'),''),package_code)),title=btrim(p_payload->>'title'),description=coalesce(p_payload->>'description',''),
      pricing_type=coalesce(nullif(p_payload->>'pricing_type',''),pricing_type),hours=coalesce(nullif(p_payload->>'hours','')::numeric,hours),
      price=coalesce(nullif(p_payload->>'price','')::numeric,price),hourly_rate=coalesce(nullif(p_payload->>'hourly_rate','')::numeric,hourly_rate),
      min_hours=coalesce(nullif(p_payload->>'min_hours','')::numeric,min_hours),max_hours=coalesce(nullif(p_payload->>'max_hours','')::numeric,max_hours),
      group_price_per_student=nullif(p_payload->>'group_price_per_student','')::numeric,
      allow_individual=coalesce((p_payload->>'allow_individual')::boolean,allow_individual),allow_group=coalesce((p_payload->>'allow_group')::boolean,allow_group),
      is_default=coalesce((p_payload->>'is_default')::boolean,is_default),is_active=coalesce((p_payload->>'is_active')::boolean,is_active),
      sort_order=coalesce(nullif(p_payload->>'sort_order','')::integer,sort_order),auto_sync=false,updated_at=now()
    where id=v_id returning * into v_row;
  end if;
  if v_row.is_default then update public.course_registration_packages set is_default=false,updated_at=now() where course_id=v_row.course_id and id<>v_row.id and is_default=true; end if;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.admin_v12_save_schedule_slot(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_id uuid:=nullif(p_payload->>'id','')::uuid; v_row public.course_schedule_slots;
begin
  if not private.v8_is_admin() then raise exception 'เฉพาะแอดมินเท่านั้น' using errcode='42501'; end if;
  if nullif(p_payload->>'course_id','') is null then raise exception 'กรุณาเลือกคอร์ส'; end if;
  if nullif(p_payload->>'start_time','') is null or nullif(p_payload->>'end_time','') is null then raise exception 'กรุณาระบุเวลา'; end if;
  if v_id is null then
    insert into public.course_schedule_slots(
      course_id,tutor_id,title,day_of_week,day_label,start_time,end_time,start_date,end_date,recurrence_rule,
      teaching_type,location_or_link,capacity,enrollment_open,is_active,note,auto_sync
    ) values (
      (p_payload->>'course_id')::bigint,nullif(p_payload->>'tutor_id','')::uuid,coalesce(p_payload->>'title',''),nullif(p_payload->>'day_of_week','')::smallint,
      coalesce(p_payload->>'day_label',''),(p_payload->>'start_time')::time,(p_payload->>'end_time')::time,nullif(p_payload->>'start_date','')::date,nullif(p_payload->>'end_date','')::date,
      coalesce(nullif(p_payload->>'recurrence_rule',''),'weekly'),coalesce(nullif(p_payload->>'teaching_type',''),'ออนไลน์'),coalesce(p_payload->>'location_or_link',''),
      greatest(1,coalesce(nullif(p_payload->>'capacity','')::integer,1)),coalesce((p_payload->>'enrollment_open')::boolean,true),coalesce((p_payload->>'is_active')::boolean,true),coalesce(p_payload->>'note',''),false
    ) returning * into v_row;
  else
    update public.course_schedule_slots set
      course_id=coalesce(nullif(p_payload->>'course_id','')::bigint,course_id),tutor_id=nullif(p_payload->>'tutor_id','')::uuid,title=coalesce(p_payload->>'title',''),
      day_of_week=nullif(p_payload->>'day_of_week','')::smallint,day_label=coalesce(p_payload->>'day_label',''),start_time=(p_payload->>'start_time')::time,end_time=(p_payload->>'end_time')::time,
      start_date=nullif(p_payload->>'start_date','')::date,end_date=nullif(p_payload->>'end_date','')::date,recurrence_rule=coalesce(nullif(p_payload->>'recurrence_rule',''),'weekly'),
      teaching_type=coalesce(nullif(p_payload->>'teaching_type',''),'ออนไลน์'),location_or_link=coalesce(p_payload->>'location_or_link',''),capacity=greatest(1,coalesce(nullif(p_payload->>'capacity','')::integer,capacity)),
      enrollment_open=coalesce((p_payload->>'enrollment_open')::boolean,enrollment_open),is_active=coalesce((p_payload->>'is_active')::boolean,is_active),note=coalesce(p_payload->>'note',''),auto_sync=false,updated_at=now()
    where id=v_id returning * into v_row;
  end if;
  return to_jsonb(v_row)||jsonb_build_object('reserved',private.v12_slot_reserved_count(v_row.id),'remaining',greatest(v_row.capacity-private.v12_slot_reserved_count(v_row.id),0));
end;
$$;

create or replace function public.admin_v12_save_discount(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare v_id uuid:=nullif(p_payload->>'id','')::uuid; v_row public.registration_discount_codes;
begin
  if not private.v8_is_admin() then raise exception 'เฉพาะแอดมินเท่านั้น' using errcode='42501'; end if;
  if btrim(coalesce(p_payload->>'code',''))='' then raise exception 'กรุณากรอกโค้ด'; end if;
  if v_id is null then
    insert into public.registration_discount_codes(code,title,discount_type,discount_value,max_discount,min_total,usage_limit,valid_from,valid_until,is_active)
    values(upper(btrim(p_payload->>'code')),coalesce(p_payload->>'title',''),coalesce(nullif(p_payload->>'discount_type',''),'fixed'),
      (p_payload->>'discount_value')::numeric,nullif(p_payload->>'max_discount','')::numeric,coalesce(nullif(p_payload->>'min_total','')::numeric,0),
      nullif(p_payload->>'usage_limit','')::integer,nullif(p_payload->>'valid_from','')::timestamptz,nullif(p_payload->>'valid_until','')::timestamptz,
      coalesce((p_payload->>'is_active')::boolean,true)) returning * into v_row;
  else
    update public.registration_discount_codes set code=upper(btrim(p_payload->>'code')),title=coalesce(p_payload->>'title',''),discount_type=coalesce(nullif(p_payload->>'discount_type',''),'fixed'),
      discount_value=(p_payload->>'discount_value')::numeric,max_discount=nullif(p_payload->>'max_discount','')::numeric,min_total=coalesce(nullif(p_payload->>'min_total','')::numeric,0),
      usage_limit=nullif(p_payload->>'usage_limit','')::integer,valid_from=nullif(p_payload->>'valid_from','')::timestamptz,valid_until=nullif(p_payload->>'valid_until','')::timestamptz,
      is_active=coalesce((p_payload->>'is_active')::boolean,is_active),updated_at=now() where id=v_id returning * into v_row;
  end if;
  return to_jsonb(v_row);
end;
$$;

create or replace function public.admin_v12_review_application(
  p_application_id uuid,
  p_decision text,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_app public.student_applications;
  v_student public.students;
  v_base jsonb;
  v_payload jsonb;
  v_primary_tutor uuid;
  v_group record;
  v_rows jsonb;
  v_item public.student_application_items;
  v_existing bigint;
begin
  if not private.v8_is_admin() then raise exception 'เฉพาะแอดมินเท่านั้น' using errcode='42501'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'คำสั่งไม่ถูกต้อง'; end if;
  select * into v_app from public.student_applications a where a.id=p_application_id for update;
  if v_app.id is null then raise exception 'ไม่พบใบสมัคร'; end if;
  if v_app.status in ('approved','rejected','withdrawn') then return to_jsonb(v_app); end if;

  if p_decision='rejected' then
    update public.student_applications set status='rejected',reviewed_by=auth.uid(),reviewed_at=now(),review_note=coalesce(p_note,''),updated_at=now()
    where id=v_app.id returning * into v_app;
    update public.student_application_items set status='rejected',updated_at=now() where application_id=v_app.id;
    return jsonb_build_object('application',to_jsonb(v_app));
  end if;

  select s.id into v_existing from public.students s
  where private.v9_normalize_phone(s.phone)=v_app.phone_normalized and coalesce(s.is_archived,false)=false order by s.id limit 1;
  select i.tutor_id into v_primary_tutor from public.student_application_items i where i.application_id=v_app.id and i.tutor_id is not null order by i.created_at limit 1;
  v_payload:=jsonb_build_object(
    'id',coalesce(v_existing::text,''),'name',trim(concat_ws(' ',v_app.nickname,v_app.first_name,v_app.last_name)),
    'first_name',v_app.first_name,'last_name',v_app.last_name,'email',v_app.email,'phone',v_app.phone,
    'school',v_app.school,'education_level',v_app.education_level,'address',v_app.address,
    'guardian_name',v_app.guardian_name,'guardian_relationship',v_app.guardian_relationship,
    'guardian_phone',v_app.guardian_phone,'guardian_line',v_app.guardian_line,'guardian_email',v_app.guardian_email,
    'status','กำลังเรียน'
  );
  v_base:=public.admin_v10_save_student(v_payload,'{}'::bigint[],v_primary_tutor);
  select * into v_student from public.students where id=(v_base->'student'->>'id')::bigint;
  update public.students set members=v_app.additional_students, class_type=case when v_app.study_type='group' then 'กลุ่ม' else 'เดี่ยว' end, updated_at=now() where id=v_student.id returning * into v_student;

  -- แยกชุดรายการตามติวเตอร์ เพราะแต่ละคอร์สอาจคนสอนต่างกัน
  for v_group in
    select i.tutor_id from public.student_application_items i where i.application_id=v_app.id group by i.tutor_id
  loop
    select coalesce(jsonb_agg(jsonb_build_object(
      'course_id',i.course_id,'hours_total',i.hours,'price',i.final_price,'start_date',i.start_date,
      'schedule_day',i.schedule_day,'start_time',i.start_time,'end_time',i.end_time,
      'teaching_type',i.teaching_type,'location_or_link',i.location_or_link,'schedule_note',i.note,
      'payment_status',case
        when v_app.total_due=0 or v_app.paid_amount_claimed>=v_app.total_due then 'ชำระแล้ว'
        when v_app.payment_option='installment' then 'แบ่งชำระ'
        when v_app.paid_amount_claimed>0 then 'แบ่งชำระ'
        else 'ค้างชำระ' end,
      'payment_method',v_app.payment_method,
      'paid_before',case when v_app.total_due>0 then round(v_app.paid_amount_claimed*i.final_price/v_app.total_due,2) else 0 end,
      'installment_count',case when v_app.payment_option='installment' then v_app.installment_count else 1 end,
      'first_due_date',current_date,'interval_days',30,
      'payment_note','จากใบสมัคร '||v_app.application_code
    ) order by i.created_at),'[]'::jsonb)
    into v_rows
    from public.student_application_items i
    where i.application_id=v_app.id and i.tutor_id is not distinct from v_group.tutor_id;
    perform private.v11_apply_course_rows(v_student.id,v_group.tutor_id,v_rows,'admin');
  end loop;

  -- เชื่อม Schedule Slot ที่เลือกกับตารางเรียนจริง
  for v_item in select * from public.student_application_items i where i.application_id=v_app.id loop
    if v_item.schedule_slot_id is not null then
      update public.student_course_schedules s set schedule_slot_id=v_item.schedule_slot_id,seat_count=v_app.group_size,updated_at=now()
      where s.student_id=v_student.id and s.course_id=v_item.course_id and s.is_active=true;
    end if;
  end loop;

  update public.student_application_items set status='approved',updated_at=now() where application_id=v_app.id;
  update public.student_applications set status='approved',student_id=v_student.id,reviewed_by=auth.uid(),reviewed_at=now(),approved_at=now(),review_note=coalesce(p_note,''),updated_at=now()
  where id=v_app.id returning * into v_app;

  insert into public.portal_notifications(audience,recipient_student_id,notification_type,title,body,entity_type,entity_id,dedupe_key)
  values('student',v_student.id,'application_approved','อนุมัติการสมัครเรียนแล้ว',
    'เลขใบสมัคร '||v_app.application_code||' · รหัสนักเรียน '||coalesce(v_student.student_code,''),
    'student_application',v_app.id::text,'application_approved:'||v_app.id::text)
  on conflict(dedupe_key) do nothing;

  return jsonb_build_object('application',to_jsonb(v_app),'student',to_jsonb(v_student));
end;
$$;

create or replace function public.admin_v12_review_speaker_request(p_request_id uuid,p_status text,p_note text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_row public.speaker_requests;
begin
  if not private.v8_is_admin() then raise exception 'เฉพาะแอดมินเท่านั้น' using errcode='42501'; end if;
  if p_status not in ('contacted','approved','rejected','completed','cancelled') then raise exception 'สถานะไม่ถูกต้อง'; end if;
  update public.speaker_requests set status=p_status,reviewed_by=auth.uid(),reviewed_at=now(),review_note=coalesce(p_note,''),updated_at=now()
  where id=p_request_id returning * into v_row;
  if v_row.id is null then raise exception 'ไม่พบคำขอ'; end if;
  return to_jsonb(v_row);
end $$;

-- --------------------------------------------------------------------------
-- 11) Storage สลิปใบสมัคร (Private)
-- Browser อัปโหลดได้เฉพาะโฟลเดอร์ UUID ที่สร้างจากใบสมัครจริง
-- --------------------------------------------------------------------------
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('registration-slips','registration-slips',false,15728640,array['image/jpeg','image/png','image/webp','application/pdf']::text[])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists v12_registration_slips_public_insert on storage.objects;
drop policy if exists v12_registration_slips_admin_read on storage.objects;
drop policy if exists v12_registration_slips_admin_delete on storage.objects;

create policy v12_registration_slips_public_insert
on storage.objects for insert to anon,authenticated
with check (
  bucket_id='registration-slips'
  and private.v12_valid_registration_upload_token((storage.foldername(name))[1])
);

create policy v12_registration_slips_admin_read
on storage.objects for select to authenticated
using (bucket_id='registration-slips' and private.v8_is_admin());

create policy v12_registration_slips_admin_delete
on storage.objects for delete to authenticated
using (bucket_id='registration-slips' and private.v8_is_admin());

-- --------------------------------------------------------------------------
-- 12) RLS / Grants
-- --------------------------------------------------------------------------
alter table public.course_registration_packages enable row level security;
alter table public.course_schedule_slots enable row level security;
alter table public.student_applications enable row level security;
alter table public.student_application_items enable row level security;
alter table public.registration_discount_codes enable row level security;
alter table public.speaker_requests enable row level security;

-- ตารางใหม่เข้าผ่าน RPC เท่านั้น
revoke all on public.course_registration_packages,public.course_schedule_slots,public.student_applications,
  public.student_application_items,public.registration_discount_codes,public.speaker_requests from anon,authenticated;
grant select,insert,update,delete on public.course_registration_packages,public.course_schedule_slots,public.student_applications,
  public.student_application_items,public.registration_discount_codes,public.speaker_requests to service_role;
grant usage,select on sequence public.student_application_code_seq to service_role;

do $$
declare f regprocedure;
begin
  foreach f in array array[
    'public.public_registration_v12_bootstrap()'::regprocedure,
    'public.public_registration_v12_check_discount(text,numeric)'::regprocedure,
    'public.public_registration_v12_submit(jsonb)'::regprocedure,
    'public.public_registration_v12_attach_slip(uuid,text,text,numeric)'::regprocedure,
    'public.public_registration_v12_check_status(text,text)'::regprocedure,
    'public.public_registration_v12_submit_speaker_request(jsonb)'::regprocedure,
    'public.admin_v12_registration_bootstrap()'::regprocedure,
    'public.admin_v12_update_course_registration(jsonb)'::regprocedure,
    'public.admin_v12_save_registration_package(jsonb)'::regprocedure,
    'public.admin_v12_save_schedule_slot(jsonb)'::regprocedure,
    'public.admin_v12_save_discount(jsonb)'::regprocedure,
    'public.admin_v12_review_application(uuid,text,text)'::regprocedure,
    'public.admin_v12_review_speaker_request(uuid,text,text)'::regprocedure
  ] loop
    execute format('revoke all on function %s from public,anon,authenticated',f);
  end loop;
end $$;

grant execute on function public.public_registration_v12_bootstrap() to anon,authenticated;
grant execute on function public.public_registration_v12_check_discount(text,numeric) to anon,authenticated;
grant execute on function public.public_registration_v12_submit(jsonb) to anon,authenticated;
grant execute on function public.public_registration_v12_attach_slip(uuid,text,text,numeric) to anon,authenticated;
grant execute on function public.public_registration_v12_check_status(text,text) to anon,authenticated;
grant execute on function public.public_registration_v12_submit_speaker_request(jsonb) to anon,authenticated;

grant execute on function public.admin_v12_registration_bootstrap() to authenticated;
grant execute on function public.admin_v12_update_course_registration(jsonb) to authenticated;
grant execute on function public.admin_v12_save_registration_package(jsonb) to authenticated;
grant execute on function public.admin_v12_save_schedule_slot(jsonb) to authenticated;
grant execute on function public.admin_v12_save_discount(jsonb) to authenticated;
grant execute on function public.admin_v12_review_application(uuid,text,text) to authenticated;
grant execute on function public.admin_v12_review_speaker_request(uuid,text,text) to authenticated;

commit;

-- --------------------------------------------------------------------------
-- Verification — ควรเป็น true ทุกช่อง
-- --------------------------------------------------------------------------
select
  to_regclass('public.student_applications') is not null as applications_ready,
  to_regclass('public.student_application_items') is not null as application_items_ready,
  to_regclass('public.course_registration_packages') is not null as packages_ready,
  to_regclass('public.course_schedule_slots') is not null as schedule_slots_ready,
  to_regprocedure('public.public_registration_v12_submit(jsonb)') is not null as public_submit_ready,
  to_regprocedure('public.admin_v12_review_application(uuid,text,text)') is not null as admin_approval_ready,
  exists(select 1 from storage.buckets where id='registration-slips' and public=false) as private_slips_ready;
