-- ============================================================================
-- Autoriser le propriétaire d'un formulaire à supprimer les fichiers de
-- réponses associés (bucket "submission-files"), nécessaire pour la
-- suppression de réponses depuis le dashboard admin. Aucune policy de
-- suppression n'existait jusqu'ici sur storage.objects pour ce bucket.
-- ============================================================================

create policy "storage_submission_files_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'submission-files'
    and exists (
      select 1 from public.file_uploads fu
      join public.submission_answers sa on sa.id = fu.submission_answer_id
      where fu.storage_path = storage.objects.name
        and public.owns_submission(sa.submission_id)
    )
  );
