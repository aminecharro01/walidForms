"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createEmptyForm, loadFullVersion } from "@/lib/supabase/forms";

export async function createFormAction(title: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const form = await createEmptyForm(supabase, user.id, title || "نموذج بدون عنوان");
  revalidatePath("/dashboard/forms");
  redirect(`/dashboard/forms/${form.id}/edit`);
}

export async function deleteFormAction(formId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("forms").delete().eq("id", formId);
  if (error) throw error;
  revalidatePath("/dashboard/forms");
}

export async function updateFormStatusAction(formId: string, status: "draft" | "published" | "paused") {
  const supabase = await createClient();

  if (status === "published") {
    const { data: form } = await supabase
      .from("forms")
      .select("current_version_id")
      .eq("id", formId)
      .single();
    if (!form?.current_version_id) throw new Error("لا توجد نسخة لنشرها");

    const { error } = await supabase
      .from("forms")
      .update({ status: "published", published_version_id: form.current_version_id })
      .eq("id", formId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("forms").update({ status }).eq("id", formId);
    if (error) throw error;
  }

  revalidatePath("/dashboard/forms");
  revalidatePath(`/dashboard/forms/${formId}/edit`);
}

export async function duplicateFormAction(formId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: original } = await supabase.from("forms").select("*").eq("id", formId).single();
  if (!original) throw new Error("النموذج غير موجود");

  const newForm = await createEmptyForm(supabase, user.id, `${original.title} (نسخة)`);

  if (original.current_version_id) {
    const { fields, sections, conditions } = await loadFullVersion(
      supabase,
      original.current_version_id
    );

    const sectionIdMap = new Map<string, string>();
    for (const section of sections) {
      const { data: newSection } = await supabase
        .from("form_sections")
        .insert({
          form_version_id: newForm.current_version_id,
          title: section.title,
          description: section.description,
          order_index: section.order_index,
        })
        .select()
        .single();
      if (newSection) sectionIdMap.set(section.id, newSection.id);
    }

    const fieldIdMap = new Map<string, string>();
    for (const field of fields) {
      const { data: newField } = await supabase
        .from("form_fields")
        .insert({
          form_version_id: newForm.current_version_id,
          section_id: field.section_id ? sectionIdMap.get(field.section_id) : null,
          type: field.type,
          label: field.label,
          description: field.description,
          placeholder: field.placeholder,
          is_required: field.is_required,
          order_index: field.order_index,
          validation: field.validation ?? {},
        })
        .select()
        .single();
      if (newField) {
        fieldIdMap.set(field.id, newField.id);
        if (field.options && field.options.length > 0) {
          await supabase.from("form_field_options").insert(
            field.options.map((o) => ({
              field_id: newField.id,
              label: o.label,
              value: o.value,
              order_index: o.order_index,
            }))
          );
        }
      }
    }

    if (conditions.length > 0) {
      await supabase.from("form_conditions").insert(
        conditions.map((c) => ({
          form_version_id: newForm.current_version_id,
          source_field_id: fieldIdMap.get(c.source_field_id),
          operator: c.operator,
          value: c.value,
          action: c.action,
          target_field_id: fieldIdMap.get(c.target_field_id),
        }))
      );
    }
  }

  revalidatePath("/dashboard/forms");
}
