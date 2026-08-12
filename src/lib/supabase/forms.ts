import type { SupabaseClient } from "@supabase/supabase-js";
import type { FormField, FormSection, FormVersion } from "@/types/form";
import type { Condition } from "@/types/condition";

/** Crée un nouveau formulaire vide avec sa première version. */
export async function createEmptyForm(
  supabase: SupabaseClient,
  ownerId: string,
  title: string
) {
  const { data: form, error: formError } = await supabase
    .from("forms")
    .insert({ owner_id: ownerId, title, status: "draft" })
    .select()
    .single();

  if (formError || !form) throw formError;

  const { data: version, error: versionError } = await supabase
    .from("form_versions")
    .insert({ form_id: form.id, version_number: 1 })
    .select()
    .single();

  if (versionError || !version) throw versionError;

  const { error: updateError } = await supabase
    .from("forms")
    .update({ current_version_id: version.id })
    .eq("id", form.id);

  if (updateError) throw updateError;

  return { ...form, current_version_id: version.id };
}

/** Charge une version complète (champs, options, sections, conditions). */
export async function loadFullVersion(
  supabase: SupabaseClient,
  versionId: string
): Promise<Pick<FormVersion, "fields" | "sections" | "conditions">> {
  const [{ data: sections }, { data: fields }, { data: conditions }] = await Promise.all([
    supabase
      .from("form_sections")
      .select("*")
      .eq("form_version_id", versionId)
      .order("order_index"),
    supabase
      .from("form_fields")
      .select("*, options:form_field_options(*)")
      .eq("form_version_id", versionId)
      .order("order_index"),
    supabase.from("form_conditions").select("*").eq("form_version_id", versionId),
  ]);

  const typedFields = (fields ?? []).map((f) => ({
    ...f,
    options: (f.options ?? []).sort(
      (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index
    ),
  })) as FormField[];

  return {
    sections: (sections ?? []) as FormSection[],
    fields: typedFields,
    conditions: (conditions ?? []) as Condition[],
  };
}
