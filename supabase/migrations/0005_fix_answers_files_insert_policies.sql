-- ============================================================================
-- Correctif : mêmes symptômes que 0004, mais sur submission_answers et
-- file_uploads. Leurs policies "*_insert_public" vérifient l'existence de la
-- ligne parente (submissions / submission_answers) via une requête directe,
-- qui est elle-même soumise aux policies de LECTURE de ces tables. Or ces
-- tables n'autorisent la lecture qu'au propriétaire du formulaire (jamais de
-- lecture publique, par design) — donc un visiteur anonyme ne peut jamais
-- valider la vérification, même pour la ligne qu'il vient de créer.
--
-- Solution : passer par des fonctions SECURITY DEFINER (comme
-- is_version_publicly_submittable) qui contournent cette restriction de
-- lecture UNIQUEMENT pour la vérification booléenne, sans exposer les
-- données elles-mêmes.
-- ============================================================================

create or replace function public.submission_form_version_is_public(p_submission_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_version_publicly_submittable(s.form_version_id)
  from public.submissions s
  where s.id = p_submission_id;
$$;

create or replace function public.submission_answer_form_version_is_public(p_submission_answer_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_version_publicly_submittable(s.form_version_id)
  from public.submission_answers sa
  join public.submissions s on s.id = sa.submission_id
  where sa.id = p_submission_answer_id;
$$;

drop policy if exists "submission_answers_insert_public" on public.submission_answers;
create policy "submission_answers_insert_public" on public.submission_answers
  for insert
  to anon, authenticated
  with check (coalesce(public.submission_form_version_is_public(submission_id), false));

drop policy if exists "file_uploads_insert_public" on public.file_uploads;
create policy "file_uploads_insert_public" on public.file_uploads
  for insert
  to anon, authenticated
  with check (coalesce(public.submission_answer_form_version_is_public(submission_answer_id), false));
