import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadFullVersion } from "@/lib/supabase/forms";
import { ResponsesTable } from "@/components/responses/responses-table";
import { ResponsesMap } from "@/components/maps/responses-map";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: form } = await supabase.from("forms").select("*").eq("id", id).single();
  if (!form) notFound();

  const versionIds = new Set<string>();
  if (form.current_version_id) versionIds.add(form.current_version_id);
  if (form.published_version_id) versionIds.add(form.published_version_id);

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, submitted_at, form_version_id")
    .eq("form_id", id)
    .order("submitted_at", { ascending: false });

  const submissionIds = (submissions ?? []).map((s) => s.id);

  let answersBySubmission = new Map<string, Record<string, unknown>>();
  let locationPoints: { id: string; lat: number; lng: number; label: string }[] = [];

  if (submissionIds.length > 0) {
    const { data: answers } = await supabase
      .from("submission_answers")
      .select("submission_id, field_id, value_json, location_lat, location_lng")
      .in("submission_id", submissionIds);

    answersBySubmission = new Map();
    for (const a of answers ?? []) {
      if (!answersBySubmission.has(a.submission_id)) answersBySubmission.set(a.submission_id, {});
      answersBySubmission.get(a.submission_id)![a.field_id] = a.value_json;
    }

    locationPoints = (answers ?? [])
      .filter((a) => a.location_lat !== null && a.location_lng !== null)
      .map((a) => ({
        id: a.submission_id + a.field_id,
        lat: a.location_lat as number,
        lng: a.location_lng as number,
        label: `رد بتاريخ ${new Date(
          submissions?.find((s) => s.id === a.submission_id)?.submitted_at ?? ""
        ).toLocaleDateString("ar-MA")}`,
      }));
  }

  // Charge les champs de toutes les versions référencées par des soumissions
  const fieldsMap = new Map<string, Awaited<ReturnType<typeof loadFullVersion>>["fields"][number]>();
  for (const versionId of versionIds) {
    const { fields } = await loadFullVersion(supabase, versionId);
    for (const f of fields) fieldsMap.set(f.id, f);
  }
  const fields = [...fieldsMap.values()].sort((a, b) => a.order_index - b.order_index);

  const rows = (submissions ?? []).map((s) => ({
    id: s.id,
    submitted_at: s.submitted_at,
    answers: answersBySubmission.get(s.id) ?? {},
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-[family-name:var(--font-cairo)] text-2xl font-bold text-slate-900">
          الردود
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {form.title} — إجمالي {rows.length.toLocaleString("ar")} رد
        </p>
      </div>

      {locationPoints.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-[family-name:var(--font-cairo)] text-base font-semibold text-slate-900">
            <MapPin className="h-4.5 w-4.5 text-brand-600" />
            خريطة الردود
          </h2>
          <ResponsesMap points={locationPoints} />
        </Card>
      )}

      <ResponsesTable fields={fields} submissions={rows} formId={form.id} />
    </div>
  );
}
