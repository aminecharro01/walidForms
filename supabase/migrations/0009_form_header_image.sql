-- ============================================================================
-- Image d'en-tête (bannière) par formulaire, affichée en haut de la page
-- publique. Bucket PUBLIC (contrairement à submission-files qui est privé) —
-- l'image doit être visible par n'importe quel visiteur non connecté.
-- ============================================================================

alter table public.forms
  add column if not exists header_image_url text;

insert into storage.buckets (id, name, public)
values ('form-headers', 'form-headers', true)
on conflict (id) do nothing;

-- Lecture publique : n'importe qui peut voir l'image (bucket public + policy).
create policy "storage_form_headers_public_read"
  on storage.objects for select
  using (bucket_id = 'form-headers');

-- Écriture réservée au propriétaire du formulaire correspondant au premier
-- segment du chemin de fichier (ex: "{form_id}/header.png").
create policy "storage_form_headers_owner_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'form-headers'
    and exists (
      select 1 from public.forms f
      where f.id::text = (storage.foldername(name))[1]
        and f.owner_id = auth.uid()
    )
  );

create policy "storage_form_headers_owner_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'form-headers'
    and exists (
      select 1 from public.forms f
      where f.id::text = (storage.foldername(name))[1]
        and f.owner_id = auth.uid()
    )
  );

create policy "storage_form_headers_owner_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'form-headers'
    and exists (
      select 1 from public.forms f
      where f.id::text = (storage.foldername(name))[1]
        and f.owner_id = auth.uid()
    )
  );
