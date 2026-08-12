-- ============================================================================
-- Supabase Storage — bucket خاص لملفات الردود (غير عام)
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('submission-files', 'submission-files', false)
on conflict (id) do nothing;

-- الوصول للملفات: فقط صاحب النموذج المرتبط بالملف عبر URL موقّع
create policy "storage_submission_files_owner_read"
  on storage.objects for select
  using (
    bucket_id = 'submission-files'
    and exists (
      select 1 from public.file_uploads fu
      join public.submission_answers sa on sa.id = fu.submission_answer_id
      where fu.storage_path = storage.objects.name
        and public.owns_submission(sa.submission_id)
    )
  );

create policy "storage_submission_files_public_insert"
  on storage.objects for insert
  with check (bucket_id = 'submission-files');

-- ============================================================================
-- Fonction utilitaire : incrémenter/créer une nouvelle version de formulaire
-- en copiant les champs, options, sections et conditions de la version
-- courante. Utilisée lors de la première édition après publication.
-- ============================================================================
create or replace function public.create_form_version_snapshot(p_form_id uuid, p_source_version_id uuid)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_new_version_id uuid;
  v_next_number integer;
  v_section_map jsonb := '{}'::jsonb;
  v_field_map jsonb := '{}'::jsonb;
  rec record;
  v_new_id uuid;
begin
  select coalesce(max(version_number), 0) + 1 into v_next_number
  from public.form_versions where form_id = p_form_id;

  insert into public.form_versions (form_id, version_number)
  values (p_form_id, v_next_number)
  returning id into v_new_version_id;

  if p_source_version_id is not null then
    for rec in select * from public.form_sections where form_version_id = p_source_version_id order by order_index loop
      insert into public.form_sections (form_version_id, title, description, order_index)
      values (v_new_version_id, rec.title, rec.description, rec.order_index)
      returning id into v_new_id;
      v_section_map := v_section_map || jsonb_build_object(rec.id::text, v_new_id::text);
    end loop;

    for rec in select * from public.form_fields where form_version_id = p_source_version_id order by order_index loop
      insert into public.form_fields (
        form_version_id, section_id, type, label, description, placeholder,
        is_required, order_index, validation
      )
      values (
        v_new_version_id,
        case when rec.section_id is not null
          then (v_section_map ->> rec.section_id::text)::uuid
          else null end,
        rec.type, rec.label, rec.description, rec.placeholder,
        rec.is_required, rec.order_index, rec.validation
      )
      returning id into v_new_id;
      v_field_map := v_field_map || jsonb_build_object(rec.id::text, v_new_id::text);
    end loop;

    for rec in
      select fo.* from public.form_field_options fo
      join public.form_fields ff on ff.id = fo.field_id
      where ff.form_version_id = p_source_version_id
      order by fo.order_index
    loop
      insert into public.form_field_options (field_id, label, value, order_index)
      values ((v_field_map ->> rec.field_id::text)::uuid, rec.label, rec.value, rec.order_index);
    end loop;

    for rec in select * from public.form_conditions where form_version_id = p_source_version_id loop
      insert into public.form_conditions (
        form_version_id, source_field_id, operator, value, action, target_field_id
      )
      values (
        v_new_version_id,
        (v_field_map ->> rec.source_field_id::text)::uuid,
        rec.operator, rec.value, rec.action,
        (v_field_map ->> rec.target_field_id::text)::uuid
      );
    end loop;
  end if;

  update public.forms set current_version_id = v_new_version_id where id = p_form_id;

  return v_new_version_id;
end;
$$;
