-- ตรวจความพร้อมก่อนติดตั้ง AreWarin Portal V12
select
  to_regclass('public.courses') is not null as courses_ready,
  to_regclass('public.students') is not null as students_ready,
  to_regclass('public.tutor_directory') is not null as tutors_ready,
  to_regclass('public.student_course_enrollments') is not null as enrollments_ready,
  to_regclass('public.student_course_schedules') is not null as schedules_ready,
  to_regprocedure('public.admin_v10_save_student(jsonb,bigint[],uuid)') is not null as save_student_ready,
  to_regprocedure('private.v11_apply_course_rows(bigint,uuid,jsonb,text)') is not null as unified_course_save_ready,
  to_regprocedure('private.v8_is_admin()') is not null as admin_check_ready,
  to_regprocedure('private.v9_normalize_phone(text)') is not null as phone_normalizer_ready;
