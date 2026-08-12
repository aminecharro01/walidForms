"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { FormField } from "@/types/form";
import type { Condition } from "@/types/condition";

export async function saveFormMetaAction(formId: string, title: string, description: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("forms").update({ title, description }).eq("id", formId);
  if (error) throw error;
  revalidatePath(`/dashboard/forms/${formId}/edit`);
}

/**
 * Sauvegarde complète des champs/options/conditions d'une version.
 * Stratégie simple et fiable pour un free-tier : upsert des champs existants,
 * insertion des nouveaux, suppression de ceux retirés (cascade sur options),
 * puis reconstruction complète des conditions avec remapping des ids
 * temporaires créés côté client vers les ids réels attribués par Postgres.
 * `idMap` est local à l'appel — sûr en environnement serverless concurrent.
 */
export async function saveVersionContentAction(
  formVersionId: string,
  fields: FormField[],
  conditions: Condition[]
) {
  const supabase = await createClient();
  const idMap = new Map<string, string>();

  const { data: existingFields } = await supabase
    .from("form_fields")
    .select("id")
    .eq("form_version_id", formVersionId);

  const existingIds = new Set((existingFields ?? []).map((f) => f.id));
  const incomingIds = new Set(fields.filter((f) => existingIds.has(f.id)).map((f) => f.id));

  const toDelete = [...existingIds].filter((id) => !incomingIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("form_fields").delete().in("id", toDelete);
  }

  for (const field of fields) {
    const isNew = !existingIds.has(field.id);
    const payload = {
      form_version_id: formVersionId,
      type: field.type,
      label: field.label,
      description: field.description ?? null,
      placeholder: field.placeholder ?? null,
      is_required: field.is_required,
      order_index: field.order_index,
      section_id: field.section_id ?? null,
      validation: field.validation ?? {},
    };

    if (isNew) {
      const { data: inserted, error } = await supabase
        .from("form_fields")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;

      idMap.set(field.id, inserted.id);

      if (field.options && field.options.length > 0) {
        await supabase.from("form_field_options").insert(
          field.options.map((o) => ({
            field_id: inserted.id,
            label: o.label,
            value: o.value,
            order_index: o.order_index,
          }))
        );
      }
    } else {
      const { error } = await supabase.from("form_fields").update(payload).eq("id", field.id);
      if (error) throw error;

      await supabase.from("form_field_options").delete().eq("field_id", field.id);
      if (field.options && field.options.length > 0) {
        await supabase.from("form_field_options").insert(
          field.options.map((o) => ({
            field_id: field.id,
            label: o.label,
            value: o.value,
            order_index: o.order_index,
          }))
        );
      }
    }
  }

  await supabase.from("form_conditions").delete().eq("form_version_id", formVersionId);

  const resolveId = (id: string) => idMap.get(id) ?? id;
  const remappedConditions = conditions
    .map((c) => ({
      form_version_id: formVersionId,
      source_field_id: resolveId(c.source_field_id),
      operator: c.operator,
      value: c.value !== null ? String(c.value) : null,
      action: c.action,
      target_field_id: resolveId(c.target_field_id),
    }))
    .filter((c) => c.source_field_id && c.target_field_id);

  if (remappedConditions.length > 0) {
    await supabase.from("form_conditions").insert(remappedConditions);
  }

  revalidatePath(`/dashboard/forms`);
}
