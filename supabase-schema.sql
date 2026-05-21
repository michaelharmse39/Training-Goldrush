-- ============================================================
-- Training Register – Supabase Schema
-- Paste this entire file into the Supabase SQL Editor and run it
-- ============================================================

-- 1. Departments
create table if not exists departments (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  color        text not null default '#6366f1',
  staff_count  int  not null default 0,
  created_at   timestamptz default now()
);

-- 2. Topics (training sessions)
create table if not exists topics (
  id                 uuid primary key default gen_random_uuid(),
  department_id      uuid references departments(id) on delete cascade,
  title              text not null,
  subject            text not null default '',
  description        text not null default '',
  date               date,
  week_ending        date,
  time               text not null default '',
  duration           text not null default '',
  location           text not null default '',
  lesson_plan_ref    text not null default '',
  trainer            text not null default '',
  trainer_signature  text not null default '',
  created_at         timestamptz default now()
);

-- 3. Attendees (register sign-ins)
create table if not exists attendees (
  id             uuid primary key default gen_random_uuid(),
  topic_id       uuid references topics(id) on delete cascade,
  department_id  uuid references departments(id) on delete cascade,
  name           text not null,
  employee_id    text not null,
  job_title      text not null default '',
  gender         text not null default '',
  equity         text not null default '',
  passport_id    text not null default '',
  age_group      text not null default '',
  disabled       boolean not null default false,
  learnership    boolean not null default false,
  signature      text not null default '',
  signed_at      timestamptz default now()
);

-- ============================================================
-- Row Level Security – open access (internal admin tool)
-- ============================================================
alter table departments enable row level security;
alter table topics       enable row level security;
alter table attendees    enable row level security;

create policy "public_all" on departments for all using (true) with check (true);
create policy "public_all" on topics       for all using (true) with check (true);
create policy "public_all" on attendees    for all using (true) with check (true);

-- ============================================================
-- Optional: seed departments (delete if you want to start blank)
-- ============================================================
insert into departments (name, color, staff_count) values
  ('Human Resources',  '#6366f1', 12),
  ('Finance',          '#f59e0b',  8),
  ('Operations',       '#10b981', 25),
  ('IT & Systems',     '#3b82f6', 15),
  ('Sales & Marketing','#ec4899', 20)
on conflict do nothing;
