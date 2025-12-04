-- Supabase schema for Registar Viskoskolskih Ustanova

create table if not exists public.institutions (
  id text primary key,
  name text not null,
  address text not null,
  city text not null,
  phone text,
  email text not null,
  website text,
  institution_type text not null check (institution_type in ('university','college','academy')),
  accreditation_status text default 'pending' check (accreditation_status in ('pending','accredited','expired','suspended')),
  logo_url text,
  ownership_type text,
  founded_on date,
  accreditation_valid_from date,
  accreditation_valid_to date,
  competent_authority text,
  notes text,
  registration_number text,
  tax_id text,
  short_name text,
  municipality text,
  postal_code text,
  country text default 'Bosna i Hercegovina',
  founder_name text,
  founding_act_reference text,
  head_name text,
  head_title text,
  fax text,
  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists public.study_programs (
  id text primary key,
  institution_id text references public.institutions(id) on delete cascade,
  name text not null,
  degree_level text not null check (degree_level in ('bachelor','master','phd','professional')),
  duration_years integer not null check (duration_years > 0 and duration_years <= 6),
  ects_credits integer,
  accreditation_status text default 'pending',
  accreditation_expiry date,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists public.accreditation_processes (
  id text primary key,
  institution_id text references public.institutions(id) on delete cascade,
  program_id text references public.study_programs(id) on delete cascade,
  assigned_officer_id text,
  process_type text not null check (process_type in ('initial','renewal','re-evaluation')),
  status text not null check (status in ('submitted','under_review','approved','rejected','appeal')),
  application_date date not null,
  decision_date date,
  decision text,
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

create table if not exists public.documents (
  id text primary key,
  institution_id text references public.institutions(id) on delete cascade,
  program_id text references public.study_programs(id) on delete cascade,
  process_id text references public.accreditation_processes(id) on delete cascade,
  document_type text not null,
  title text,
  description text,
  issuer text,
  issued_at date,
  number text,
  file_name text not null,
  file_path text not null,
  file_size integer,
  mime_type text,
  sha256 text,
  version integer default 1,
  is_confidential boolean default false,
  tags text,
  uploaded_by text,
  uploaded_at timestamp default now()
);

create table if not exists public.users (
  id text primary key,
  email text unique not null,
  password text not null,
  full_name text not null,
  role text not null check (role in ('admin','operator','viewer','institution')),
  is_active boolean default true,
  institution_id text references public.institutions(id),
  created_at timestamp default now()
);

create table if not exists public.audit_logs (
  id text primary key,
  actor_id text,
  actor_role text,
  actor_name text,
  action text,
  resource_type text,
  resource_id text,
  changed_fields text,
  prev_values text,
  new_values text,
  created_at timestamp default now()
);

-- Optional: enable RLS and policies later as needed for production

