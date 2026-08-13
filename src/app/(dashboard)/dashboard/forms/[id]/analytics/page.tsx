import { notFound } from "next/navigation";
import { BarChart3, MessageSquare, MapPin as MapPinIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadFullVersion } from "@/lib/supabase/forms";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { ResponsesLineChart } from "@/components/charts/responses-line-chart";
import { DistributionBarChart } from "@/components/charts/distribution-bar-chart";
import { EmptyState } from "@/components/ui/empty-state";
import { getServerT } from "@/lib/i18n/server";
import { chunk } from "@/lib/utils/chunk";

const IN_CHUNK_SIZE = 150;

export const dynamic = "force-dynamic";

export default async function AnalyticsPage({
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
    .select("id, submitted_at, form_version_id")
    .eq("form_id", id)
    .order("submitted_at", { ascending: true });

  const total = submissions?.length ?? 0;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayCount = (submissions ?? []).filter((s) => new Date(s.submitted_at) >= startOfToday).length;

  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  const weekCount = (submissions ?? []).filter((s) => new Date(s.submitted_at) >= startOfWeek).length;

  // Réponses par jour (30 derniers jours)
  const dailyMap = new Map<string, number>();
  const last30 = new Date();
  last30.setDate(last30.getDate() - 30);
  for (const s of submissions ?? []) {
    const d = new Date(s.submitted_at);
    if (d < last30) continue;
    const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
  }
  const dailyData = [...dailyMap.entries()].map(([date, count]) => ({ date, count }));

  // Champs à choix (radio/checkbox/select) pour distributions — toutes les versions
  // réellement référencées par les soumissions, pas seulement la version courante/publiée.
  const versionIds = new Set<string>();
  if (form.current_version_id) versionIds.add(form.current_version_id);
  if (form.published_version_id) versionIds.add(form.published_version_id);
  for (const s of submissions ?? []) {
    if (s.form_version_id) versionIds.add(s.form_version_id);
  }

  const fieldsMap = new Map<string, Awaited<ReturnType<typeof loadFullVersion>>["fields"][number]>();
  for (const versionId of versionIds) {
    const { fields } = await loadFullVersion(supabase, versionId);
    for (const f of fields) fieldsMap.set(f.id, f);
  }
  const choiceFields = [...fieldsMap.values()].filter((f) =>
    ["radio", "checkbox", "select"].includes(f.type)
  );
  const locationFieldExists = [...fieldsMap.values()].some((f) => f.type === "location");

  const submissionIds = (submissions ?? []).map((s) => s.id);
  let distributionsByField = new Map<string, Map<string, number>>();
  let locationCount = 0;

  if (submissionIds.length > 0) {
    const answers: { field_id: string; value_json: unknown; location_lat: number | null }[] = [];
    for (const idsBatch of chunk(submissionIds, IN_CHUNK_SIZE)) {
      const { data, error } = await supabase
        .from("submission_answers")
        .select("field_id, value_json, location_lat")
        .in("submission_id", idsBatch);
      if (error) {
        console.error("analytics: fetch submission_answers batch failed", error);
        continue;
      }
      answers.push(...(data ?? []));
    }

    distributionsByField = new Map();
    for (const a of answers) {
      const field = fieldsMap.get(a.field_id);
      if (!field || !["radio", "checkbox", "select"].includes(field.type)) continue;

      if (!distributionsByField.has(a.field_id)) distributionsByField.set(a.field_id, new Map());
      const dist = distributionsByField.get(a.field_id)!;

      const values = Array.isArray(a.value_json) ? a.value_json : [a.value_json];
      for (const v of values) {
        if (v === null || v === undefined || v === "") continue;
        const key = String(v);
        dist.set(key, (dist.get(key) ?? 0) + 1);
      }
    }

    locationCount = answers.filter((a) => a.location_lat !== null).length;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-[family-name:var(--font-cairo)] text-2xl font-bold text-slate-900">
          {t("analytics.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{form.title}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("dash.totalResponses")} value={total.toLocaleString()} icon={MessageSquare} tone="brand" />
        <StatCard label={t("dash.todayResponses")} value={todayCount} icon={BarChart3} tone="amber" />
        <StatCard label={t("analytics.last7days")} value={weekCount} icon={BarChart3} tone="sky" />
        {locationFieldExists && (
          <StatCard label={t("analytics.withLocation")} value={locationCount} icon={MapPinIcon} tone="emerald" />
        )}
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-[family-name:var(--font-cairo)] text-base font-semibold text-slate-900">
          {t("analytics.overTime")}
        </h2>
        {dailyData.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title={t("analytics.notEnoughData")}
            description={t("analytics.notEnoughDataDesc")}
          />
        ) : (
          <ResponsesLineChart data={dailyData} />
        )}
      </Card>

      {choiceFields.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {choiceFields.map((field) => {
            const dist = distributionsByField.get(field.id);
            const data = [...(dist?.entries() ?? [])]
              .map(([label, count]) => ({ label, count }))
              .sort((a, b) => b.count - a.count);

            return (
              <Card key={field.id} className="p-5">
                <h3 className="mb-4 font-[family-name:var(--font-cairo)] text-sm font-semibold text-slate-900">
                  {field.label}
                </h3>
                {data.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">{t("analytics.noAnswers")}</p>
                ) : (
                  <DistributionBarChart data={data} />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
