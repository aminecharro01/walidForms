-- ============================================================================
-- Correctif : les policies d'insertion publique doivent s'appliquer au rôle
-- "anon" (visiteurs non connectés), pas seulement à "authenticated".
-- Si une policy a été recréée/éditée depuis le dashboard Supabase, son
-- "Target roles" peut avoir été fixé par défaut à "authenticated" seul,
-- ce qui bloque silencieusement toute soumission publique (erreur 42501).
-- ============================================================================

drop policy if exists "submissions_insert_public" on public.submissions;
create policy "submissions_insert_public" on public.submissions
  for insert
  to anon, authenticated
  with check (public.is_version_publicly_submittable(form_version_id));

drop policy if exists "submission_answers_insert_public" on public.submission_answers;
create policy "submission_answers_insert_public" on public.submission_answers
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id
        and public.is_version_publicly_submittable(s.form_version_id)
    )
  );

drop policy if exists "file_uploads_insert_public" on public.file_uploads;
create policy "file_uploads_insert_public" on public.file_uploads
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.submission_answers sa
      join public.submissions s on s.id = sa.submission_id
      where sa.id = submission_answer_id
        and public.is_version_publicly_submittable(s.form_version_id)
    )
  );

drop policy if exists "storage_submission_files_public_insert" on storage.objects;
create policy "storage_submission_files_public_insert"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'submission-files');
