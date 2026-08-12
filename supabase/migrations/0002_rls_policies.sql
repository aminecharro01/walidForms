-- ============================================================================
-- سياسات أمان الصفوف (Row Level Security)
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.forms enable row level security;
alter table public.form_versions enable row level security;
alter table public.form_sections enable row level security;
alter table public.form_fields enable row level security;
alter table public.form_field_options enable row level security;
alter table public.form_conditions enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_answers enable row level security;
alter table public.file_uploads enable row level security;

-- ----------------------------------------------------------------------------
-- Fonctions SECURITY DEFINER : vérifications croisées sans exposer les tables
-- ----------------------------------------------------------------------------

-- Un form_version_id correspond-il à la version PUBLIÉE d'un formulaire publié ?
create or replace function public.is_version_publicly_submittable(p_form_version_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.forms f
    where f.published_version_id = p_form_version_id
      and f.status = 'published'
  );
$$;

-- Propriétaire d'un form_version_id (utilisé par les policies imbriquées)
create or replace function public.owns_form_version(p_form_version_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.form_versions fv
    join public.forms f on f.id = fv.form_id
    where fv.id = p_form_version_id
      and f.owner_id = auth.uid()
  );
$$;

-- Propriétaire d'un form_field_id
create or replace function public.owns_form_field(p_field_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.form_fields ff
    join public.form_versions fv on fv.id = ff.form_version_id
    join public.forms f on f.id = fv.form_id
    where ff.id = p_field_id
      and f.owner_id = auth.uid()
  );
$$;

-- Propriétaire d'une submission (via form)
create or replace function public.owns_submission(p_submission_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.submissions s
    join public.forms f on f.id = s.form_id
    where s.id = p_submission_id
      and f.owner_id = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- forms
-- ----------------------------------------------------------------------------
create policy "forms_select_own" on public.forms
  for select using (owner_id = auth.uid());

create policy "forms_select_public_published" on public.forms
  for select using (status = 'published');

create policy "forms_insert_own" on public.forms
  for insert with check (owner_id = auth.uid());

create policy "forms_update_own" on public.forms
  for update using (owner_id = auth.uid());

create policy "forms_delete_own" on public.forms
  for delete using (owner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- form_versions
-- ----------------------------------------------------------------------------
create policy "form_versions_select_own" on public.form_versions
  for select using (
    exists (select 1 from public.forms f where f.id = form_id and f.owner_id = auth.uid())
  );

create policy "form_versions_select_public" on public.form_versions
  for select using (
    exists (
      select 1 from public.forms f
      where f.id = form_id and f.status = 'published' and f.published_version_id = form_versions.id
    )
  );

create policy "form_versions_insert_own" on public.form_versions
  for insert with check (
    exists (select 1 from public.forms f where f.id = form_id and f.owner_id = auth.uid())
  );

create policy "form_versions_delete_own" on public.form_versions
  for delete using (
    exists (select 1 from public.forms f where f.id = form_id and f.owner_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- form_sections
-- ----------------------------------------------------------------------------
create policy "form_sections_select_own" on public.form_sections
  for select using (public.owns_form_version(form_version_id));

create policy "form_sections_select_public" on public.form_sections
  for select using (public.is_version_publicly_submittable(form_version_id));

create policy "form_sections_insert_own" on public.form_sections
  for insert with check (public.owns_form_version(form_version_id));

create policy "form_sections_update_own" on public.form_sections
  for update using (public.owns_form_version(form_version_id));

create policy "form_sections_delete_own" on public.form_sections
  for delete using (public.owns_form_version(form_version_id));

-- ----------------------------------------------------------------------------
-- form_fields
-- ----------------------------------------------------------------------------
create policy "form_fields_select_own" on public.form_fields
  for select using (public.owns_form_version(form_version_id));

create policy "form_fields_select_public" on public.form_fields
  for select using (public.is_version_publicly_submittable(form_version_id));

create policy "form_fields_insert_own" on public.form_fields
  for insert with check (public.owns_form_version(form_version_id));

create policy "form_fields_update_own" on public.form_fields
  for update using (public.owns_form_version(form_version_id));

create policy "form_fields_delete_own" on public.form_fields
  for delete using (public.owns_form_version(form_version_id));

-- ----------------------------------------------------------------------------
-- form_field_options
-- ----------------------------------------------------------------------------
create policy "form_field_options_select_own" on public.form_field_options
  for select using (public.owns_form_field(field_id));

create policy "form_field_options_select_public" on public.form_field_options
  for select using (
    exists (
      select 1 from public.form_fields ff
      where ff.id = field_id and public.is_version_publicly_submittable(ff.form_version_id)
    )
  );

create policy "form_field_options_insert_own" on public.form_field_options
  for insert with check (public.owns_form_field(field_id));

create policy "form_field_options_update_own" on public.form_field_options
  for update using (public.owns_form_field(field_id));

create policy "form_field_options_delete_own" on public.form_field_options
  for delete using (public.owns_form_field(field_id));

-- ----------------------------------------------------------------------------
-- form_conditions
-- ----------------------------------------------------------------------------
create policy "form_conditions_select_own" on public.form_conditions
  for select using (public.owns_form_version(form_version_id));

create policy "form_conditions_select_public" on public.form_conditions
  for select using (public.is_version_publicly_submittable(form_version_id));

create policy "form_conditions_insert_own" on public.form_conditions
  for insert with check (public.owns_form_version(form_version_id));

create policy "form_conditions_update_own" on public.form_conditions
  for update using (public.owns_form_version(form_version_id));

create policy "form_conditions_delete_own" on public.form_conditions
  for delete using (public.owns_form_version(form_version_id));

-- ----------------------------------------------------------------------------
-- submissions — jamais de lecture publique, insertion publique contrôlée
-- ----------------------------------------------------------------------------
create policy "submissions_select_own" on public.submissions
  for select using (
    exists (select 1 from public.forms f where f.id = form_id and f.owner_id = auth.uid())
  );

create policy "submissions_insert_public" on public.submissions
  for insert with check (public.is_version_publicly_submittable(form_version_id));

create policy "submissions_delete_own" on public.submissions
  for delete using (
    exists (select 1 from public.forms f where f.id = form_id and f.owner_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- submission_answers — jamais de lecture publique
-- ----------------------------------------------------------------------------
create policy "submission_answers_select_own" on public.submission_answers
  for select using (public.owns_submission(submission_id));

create policy "submission_answers_insert_public" on public.submission_answers
  for insert with check (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id
        and public.is_version_publicly_submittable(s.form_version_id)
    )
  );

create policy "submission_answers_delete_own" on public.submission_answers
  for delete using (public.owns_submission(submission_id));

-- ----------------------------------------------------------------------------
-- file_uploads — jamais de lecture publique
-- ----------------------------------------------------------------------------
create policy "file_uploads_select_own" on public.file_uploads
  for select using (
    exists (
      select 1 from public.submission_answers sa
      where sa.id = submission_answer_id and public.owns_submission(sa.submission_id)
    )
  );

create policy "file_uploads_insert_public" on public.file_uploads
  for insert with check (
    exists (
      select 1 from public.submission_answers sa
      join public.submissions s on s.id = sa.submission_id
      where sa.id = submission_answer_id
        and public.is_version_publicly_submittable(s.form_version_id)
    )
  );

create policy "file_uploads_delete_own" on public.file_uploads
  for delete using (
    exists (
      select 1 from public.submission_answers sa
      where sa.id = submission_answer_id and public.owns_submission(sa.submission_id)
    )
  );
