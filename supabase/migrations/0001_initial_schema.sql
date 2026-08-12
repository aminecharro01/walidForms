-- ============================================================================
-- منصة النماذج — المخطط الأولي / Initial schema
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- profiles — امتداد لجدول auth.users
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ----------------------------------------------------------------------------
-- forms — الميتاداتا الثابتة للنموذج
-- ----------------------------------------------------------------------------
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'نموذج بدون عنوان',
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'paused')),
  public_slug text not null unique default encode(gen_random_bytes(8), 'hex'),
  current_version_id uuid,
  published_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_forms_owner on public.forms(owner_id);
create index if not exists idx_forms_public_slug on public.forms(public_slug);
create index if not exists idx_forms_status on public.forms(status);

-- ----------------------------------------------------------------------------
-- form_versions — نسخة غير قابلة للتعديل بعد إنشائها فعليًا (لكن تُنشأ نسخة جديدة عند التعديل بعد النشر)
-- ----------------------------------------------------------------------------
create table if not exists public.form_versions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  version_number integer not null,
  created_at timestamptz not null default now(),
  unique (form_id, version_number)
);

create index if not exists idx_form_versions_form on public.form_versions(form_id);

alter table public.forms
  add constraint fk_forms_current_version
  foreign key (current_version_id) references public.form_versions(id) on delete set null;

alter table public.forms
  add constraint fk_forms_published_version
  foreign key (published_version_id) references public.form_versions(id) on delete set null;

-- ----------------------------------------------------------------------------
-- form_sections — أقسام النموذج (اختياري)
-- ----------------------------------------------------------------------------
create table if not exists public.form_sections (
  id uuid primary key default gen_random_uuid(),
  form_version_id uuid not null references public.form_versions(id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 0
);

create index if not exists idx_form_sections_version on public.form_sections(form_version_id);

-- ----------------------------------------------------------------------------
-- form_fields — حقول النموذج
-- ----------------------------------------------------------------------------
create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_version_id uuid not null references public.form_versions(id) on delete cascade,
  section_id uuid references public.form_sections(id) on delete set null,
  type text not null check (type in (
    'short_text', 'long_text', 'number', 'email', 'date', 'time',
    'radio', 'checkbox', 'select', 'location', 'file'
  )),
  label text not null default '',
  description text,
  placeholder text,
  is_required boolean not null default false,
  order_index integer not null default 0,
  validation jsonb default '{}'::jsonb
);

create index if not exists idx_form_fields_version on public.form_fields(form_version_id);

-- ----------------------------------------------------------------------------
-- form_field_options — خيارات الحقول (radio/checkbox/select)
-- ----------------------------------------------------------------------------
create table if not exists public.form_field_options (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.form_fields(id) on delete cascade,
  label text not null,
  value text not null,
  order_index integer not null default 0
);

create index if not exists idx_form_field_options_field on public.form_field_options(field_id);

-- ----------------------------------------------------------------------------
-- form_conditions — قواعد المنطق الشرطي
-- ----------------------------------------------------------------------------
create table if not exists public.form_conditions (
  id uuid primary key default gen_random_uuid(),
  form_version_id uuid not null references public.form_versions(id) on delete cascade,
  source_field_id uuid not null references public.form_fields(id) on delete cascade,
  operator text not null check (operator in (
    'equals', 'not_equals', 'contains', 'greater_than', 'less_than',
    'greater_or_equal', 'less_or_equal', 'is_empty', 'is_not_empty'
  )),
  value text,
  action text not null check (action in ('show', 'hide')),
  target_field_id uuid not null references public.form_fields(id) on delete cascade
);

create index if not exists idx_form_conditions_version on public.form_conditions(form_version_id);

-- ----------------------------------------------------------------------------
-- submissions — الردود
-- ----------------------------------------------------------------------------
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  form_version_id uuid not null references public.form_versions(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  ip_hash text,
  user_agent text
);

create index if not exists idx_submissions_form on public.submissions(form_id);
create index if not exists idx_submissions_version on public.submissions(form_version_id);
create index if not exists idx_submissions_submitted_at on public.submissions(submitted_at desc);

-- ----------------------------------------------------------------------------
-- submission_answers — إجابات فردية لكل حقل
-- ----------------------------------------------------------------------------
create table if not exists public.submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  field_id uuid not null references public.form_fields(id) on delete cascade,
  value_json jsonb,
  location_lat double precision,
  location_lng double precision,
  location_accuracy double precision
);

create index if not exists idx_submission_answers_submission on public.submission_answers(submission_id);
create index if not exists idx_submission_answers_field on public.submission_answers(field_id);
create index if not exists idx_submission_answers_location
  on public.submission_answers(location_lat, location_lng)
  where location_lat is not null;

-- ----------------------------------------------------------------------------
-- file_uploads — ملفات مرفوعة عبر Supabase Storage
-- ----------------------------------------------------------------------------
create table if not exists public.file_uploads (
  id uuid primary key default gen_random_uuid(),
  submission_answer_id uuid not null references public.submission_answers(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_size bigint not null,
  mime_type text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_file_uploads_answer on public.file_uploads(submission_answer_id);

-- ----------------------------------------------------------------------------
-- updated_at triggers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_forms_updated_at on public.forms;
create trigger trg_forms_updated_at
  before update on public.forms
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();
