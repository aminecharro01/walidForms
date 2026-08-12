import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadFullVersion } from "@/lib/supabase/forms";
import { FormBuilderClient } from "@/components/form-builder/form-builder-client";
import type { Form } from "@/types/form";

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase.from("forms").select("*").eq("id", id).single();
  if (!form) notFound();

  let fields: Awaited<ReturnType<typeof loadFullVersion>>["fields"] = [];
  let conditions: Awaited<ReturnType<typeof loadFullVersion>>["conditions"] = [];

  if (form.current_version_id) {
    const content = await loadFullVersion(supabase, form.current_version_id);
    fields = content.fields;
    conditions = content.conditions;
  }

  return (
    <div className="fixed inset-0 lg:mr-64">
      <FormBuilderClient form={form as Form} initialFields={fields} initialConditions={conditions} />
    </div>
  );
}
