import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadFullVersion } from "@/lib/supabase/forms";
import { PublicFormClient } from "./public-form-client";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ publicFormId: string }>;
}) {
  const { publicFormId } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id, title, description, status, language, published_version_id, public_slug")
    .eq("public_slug", publicFormId)
    .single();

  if (!form || form.status !== "published" || !form.published_version_id) {
    notFound();
  }

  const { fields, conditions } = await loadFullVersion(supabase, form.published_version_id);

  return (
    <PublicFormClient
      publicSlug={form.public_slug}
      title={form.title}
      description={form.description}
      language={form.language === "fr" ? "fr" : "ar"}
      fields={fields}
      conditions={conditions}
    />
  );
}
