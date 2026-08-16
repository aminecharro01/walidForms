import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadFullVersion } from "@/lib/supabase/forms";
import { ResponsesTable } from "@/components/responses/responses-table";
import { ResponsesMap } from "@/components/maps/responses-map";
import { Card } from "@/components/ui/card";
import { formatDateFr } from "@/lib/utils/format";
import { fetchAllInBatches, FETCH_PAGE_SIZE } from "@/lib/supabase/fetch-in-batches";
import { getServerT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

interface AnswerRow {
  submission_id: string;
  field_id: string;
  value_json: unknown;
  location_lat: number | null;
  location_lng: number | null;
}

export default async function ResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { t } = await getServerT();

  const { data: form } = await supabase.from("forms").select("*").eq("id", id).single();
  if (!form) notFound();

  const { data: submissions } = await supabase
    .from("submissions")
    .select("id, submitted_at, form_version_id, answers_snapshot")
    .eq("form_id", id)
    .order("submitted_at", { ascending: false });

  const submissionIds = (submissions ?? []).map((s) => s.id);

  // Toutes les versions réellement référencées par les soumissions, pas seulement
  // la version courante/publiée : après modification d'un formulaire déjà publié,
  // les anciennes réponses restent liées à des champs d'une version précédente.
  const versionIds = new Set<string>();
  if (form.current_version_id) versionIds.add(form.current_version_id);
  if (form.published_version_id) versionIds.add(form.published_version_id);
  for (const s of submissions ?? []) {
    if (s.form_version_id) versionIds.add(s.form_version_id);
  }

  let answersBySubmission = new Map<string, Record<string, unknown>>();
  let locationPoints: { id: string; lat: number; lng: number; label: string }[] = [];

  if (submissionIds.length > 0) {
    const { rows: answers, batchErrors } = await fetchAllInBatches<AnswerRow>(
      submissionIds,
      async (idsBatch, offset) =>
        await supabase
          .from("submission_answers")
          .select("submission_id, field_id, value_json, location_lat, location_lng")
          .in("submission_id", idsBatch)
          .range(offset, offset + FETCH_PAGE_SIZE - 1)
    );
    if (batchErrors.length > 0) {
      console.error("responses page: fetch submission_answers batch failed", batchErrors);
    }

    answersBySubmission = new Map();
    for (const a of answers) {
      if (!answersBySubmission.has(a.submission_id)) answersBySubmission.set(a.submission_id, {});
      answersBySubmission.get(a.submission_id)![a.field_id] = a.value_json;
    }

    locationPoints = answers
      .filter((a) => a.location_lat !== null && a.location_lng !== null)
      .map((a) => ({
        id: a.submission_id + a.field_id,
        lat: a.location_lat as number,
        lng: a.location_lng as number,
        label: `${t("resp.responseDated")} ${formatDateFr(
          submissions?.find((s) => s.id === a.submission_id)?.submitted_at ?? "",
          { withTime: false }
        )}`,
      }));
  }

  // Charge les champs de toutes les versions référencées par des soumissions
  const fieldsMap = new Map<string, Awaited<ReturnType<typeof loadFullVersion>>["fields"][number]>();
  for (const versionId of versionIds) {
    const { fields } = await loadFullVersion(supabase, versionId);
    for (const f of fields) fieldsMap.set(f.id, f);
  }
  const fields = [...fieldsMap.values()].sort((a, b) => a.order_index - b.order_index);

  const rows = (submissions ?? []).map((s) => {
    const indexedAnswers = answersBySubmission.get(s.id);
    const hasIndexedAnswers = indexedAnswers && Object.keys(indexedAnswers).length > 0;
    const snapshot = (s.answers_snapshot as Record<string, unknown> | null) ?? {};
    const usingSnapshot = !hasIndexedAnswers && Object.keys(snapshot).length > 0;

    return {
      id: s.id,
      submitted_at: s.submitted_at,
      answers: hasIndexedAnswers ? indexedAnswers! : snapshot,
      usingSnapshot,
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-[family-name:var(--font-cairo)] text-2xl font-bold text-slate-900">
          {t("resp.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {form.title} — {t("resp.totalPrefix")} {rows.length.toLocaleString()} {t("forms.responseCount")}
        </p>
      </div>

      {locationPoints.length > 0 && (
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-[family-name:var(--font-cairo)] text-base font-semibold text-slate-900">
            <MapPin className="h-4.5 w-4.5 text-brand-600" />
            {t("resp.locationMap")}
          </h2>
          <ResponsesMap points={locationPoints} />
        </Card>
      )}

      <ResponsesTable fields={fields} submissions={rows} formId={form.id} />
    </div>
  );
}
