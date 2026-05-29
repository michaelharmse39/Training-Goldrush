-- ============================================================
-- Training Register – Complete Supabase Schema
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

-- 4. Users (profile data linked to Supabase Auth)
create table if not exists users (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  role                text not null default 'staff',  -- 'admin' | 'dept_head' | 'staff'
  department_id       uuid references departments(id) on delete set null,
  approved            boolean not null default false,
  self_registered     boolean not null default false,
  totp_enabled        boolean not null default false,
  totp_secret         text,
  totp_secret_pending text,
  created_at          timestamptz default now()
);

-- 5. OTP codes (email verification during signup)
create table if not exists otp_codes (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  otp        text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- 6. Assessments
create table if not exists assessments (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text not null default '',
  department_id uuid references departments(id) on delete set null,
  topic_id      uuid references topics(id) on delete set null,
  questions     jsonb not null default '[]',
  time_limit    int  not null default 0,  -- minutes, 0 = no limit
  pass_mark     int  not null default 70, -- percentage
  manual_id     uuid,
  is_active     boolean not null default true,
  created_at    timestamptz default now()
);

-- 7. Assessment results
create table if not exists assessment_results (
  id               uuid primary key default gen_random_uuid(),
  assessment_id    uuid references assessments(id) on delete cascade,
  assessment_title text not null,
  user_id          uuid references auth.users(id) on delete cascade,
  user_email       text not null,
  user_name        text not null default '',
  department_id    uuid references departments(id) on delete set null,
  score            int not null,
  passed           boolean not null,
  answers          jsonb not null default '[]',
  time_spent       int not null default 0, -- seconds
  completed_at     timestamptz default now()
);

-- 8. Manuals (uploaded PDFs/files)
create table if not exists manuals (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  department_id uuid references departments(id) on delete set null,
  topic_id      uuid references topics(id) on delete set null,
  file_url      text not null,
  file_name     text not null,
  file_size     int not null default 0,
  public_id     text not null default '',
  uploaded_at   timestamptz default now()
);

-- 9. Training sessions (scheduled classes)
create table if not exists training_sessions (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null default '',
  department_id   uuid references departments(id) on delete set null,
  assessment_id   uuid references assessments(id) on delete set null,
  trainer         text not null default '',
  location        text not null default '',
  scheduled_date  date,
  available_times jsonb not null default '[]',
  max_capacity    int not null default 20,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz default now()
);

-- 10. Session bookings
create table if not exists session_bookings (
  id             uuid primary key default gen_random_uuid(),
  session_id     uuid references training_sessions(id) on delete cascade,
  session_title  text not null,
  user_id        uuid references auth.users(id) on delete cascade,
  user_name      text not null default '',
  user_email     text not null,
  available_times jsonb not null default '[]',
  booked_at      timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table departments       enable row level security;
alter table topics             enable row level security;
alter table attendees          enable row level security;
alter table users              enable row level security;
alter table otp_codes          enable row level security;
alter table assessments        enable row level security;
alter table assessment_results enable row level security;
alter table manuals            enable row level security;
alter table training_sessions  enable row level security;
alter table session_bookings   enable row level security;

-- Open access (service role bypasses RLS; anon key used only from client)
create policy "public_all" on departments       for all using (true) with check (true);
create policy "public_all" on topics             for all using (true) with check (true);
create policy "public_all" on attendees          for all using (true) with check (true);
create policy "public_all" on users              for all using (true) with check (true);
create policy "public_all" on otp_codes          for all using (true) with check (true);
create policy "public_all" on assessments        for all using (true) with check (true);
create policy "public_all" on assessment_results for all using (true) with check (true);
create policy "public_all" on manuals            for all using (true) with check (true);
create policy "public_all" on training_sessions  for all using (true) with check (true);
create policy "public_all" on session_bookings   for all using (true) with check (true);

-- ============================================================
-- Seed departments (delete this block if you want to start blank)
-- ============================================================
insert into departments (name, color, staff_count) values
  ('Human Resources',  '#6366f1', 12),
  ('Finance',          '#f59e0b',  8),
  ('Operations',       '#10b981', 25),
  ('IT & Systems',     '#3b82f6', 15),
  ('Sales & Marketing','#ec4899', 20)
on conflict do nothing;
