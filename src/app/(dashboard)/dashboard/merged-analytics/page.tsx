import Link from "next/link";
import { Building2, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadFullVersion } from "@/lib/supabase/forms";
import { fetchAllInBatches, FETCH_PAGE_SIZE } from "@/lib/supabase/fetch-in-batches";
import {
  findFieldByKeywords,
  classifyOccupancy,
  type OccupancyStatus,
} from "@/lib/analytics/merge-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MergedDashboardClient, type MergedDashboardData } from "./dashboard-client";
import type { FormField } from "@/types/form";

export const dynamic = "force-dynamic";

interface AnswerRow {
  submission_id: string;
  field_id: string;
  value_json: unknown;
  location_lat: number | null;
  location_lng: number | null;
}

interface RoleMap {
  street?: string;
  block?: string;
  buildingNumber?: string;
  buildingType?: string;
  floors?: string;
  status?: string;
  location?: string;
  note?: string;
}

interface BuildingRecord {
  street: string | null;
  block: string | null;
  buildingNumber: string | null;
  buildingTypes: string[];
  floors: string | null;
  statusCat: OccupancyStatus;
  lat: number | null;
  lng: number | null;
  note: string | null;
}

function buildRoleMap(fields: FormField[]): RoleMap {
  return {
    street: findFieldByKeywords(fields, ["درب"])?.id,
    block: findFieldByKeywords(fields, ["جزير"])?.id,
    buildingNumber: findFieldByKeywords(fields, ["رقم"])?.id,
    buildingType: findFieldByKeywords(fields, ["صنف"])?.id,
    floors: findFieldByKeywords(fields, ["طوابق"])?.id,
    status: findFieldByKeywords(fields, ["حال"])?.id,
    location: fields.find((f) => f.type === "location")?.id,
    note: findFieldByKeywords(fields, ["ملاحظ"])?.id,
  };
}

function countBy(values: (string | null)[]) {
  const map = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-MA", { year: "numeric", month: "long", day: "numeric" });
}

export default async function MergedAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ forms?: string | string[] }>;
}) {
  const { forms: formsParam } = await searchParams;
  const selectedFormIds = !formsParam ? [] : Array.isArray(formsParam) ? formsParam : [formsParam];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: allForms } = await supabase
    .from("forms")
    .select("id, title, status")
    .eq("owner_id", user!.id)
    .order("updated_at", { ascending: false });

  // -------------------------------------------------------------------------
  // Étape 1 : sélection des formulaires à fusionner (formulaire GET, sans JS,
  // rien n'est écrit en base — juste des paramètres d'URL).
  // -------------------------------------------------------------------------
  if (selectedFormIds.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
        <div>
          <h1 className="font-[family-name:var(--font-cairo)] text-2xl font-bold text-slate-900">
            دمج وتحليل بيانات متعددة
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            اختر نموذجين أو أكثر (مثلاً أيام متعددة من نفس المسح الميداني) لدمج ردودهما في لوحة تحليلية
            موحدة. القراءة فقط — لا يتم تعديل أي بيانات.
          </p>
        </div>

        {!allForms || allForms.length === 0 ? (
          <EmptyState icon={Layers} title="لا توجد نماذج بعد" description="أنشئ نماذجك أولاً لتتمكن من دمجها" />
        ) : (
          <form method="GET">
            <Card className="divide-y divide-slate-100 p-0">
              {allForms.map((f) => (
                <label
                  key={f.id}
                  className="flex cursor-pointer items-center gap-3 p-4 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    name="forms"
                    value={f.id}
                    className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-slate-800">{f.title}</span>
                </label>
              ))}
            </Card>
            <Button type="submit" className="mt-4 w-full">
              دمج وتحليل
            </Button>
          </form>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Étape 2 : récupération de toutes les soumissions des formulaires choisis
  // -------------------------------------------------------------------------
  const selectedForms = (allForms ?? []).filter((f) => selectedFormIds.includes(f.id));

  const submissions: {
    id: string;
    form_id: string;
    form_version_id: string;
    answers_snapshot: unknown;
    submitted_at: string;
  }[] = [];
  {
    let offset = 0;
    while (true) {
      const { data } = await supabase
        .from("submissions")
        .select("id, form_id, form_version_id, answers_snapshot, submitted_at")
        .in("form_id", selectedFormIds)
        .range(offset, offset + FETCH_PAGE_SIZE - 1);
      if (!data || data.length === 0) break;
      submissions.push(...data);
      if (data.length < FETCH_PAGE_SIZE) break;
      offset += FETCH_PAGE_SIZE;
    }
  }

  const submissionIds = submissions.map((s) => s.id);

  // Champs de toutes les versions référencées, par version (les libellés peuvent
  // varier légèrement d'un formulaire/jour à l'autre, d'où la correspondance par
  // mots-clés plutôt que par identifiant).
  const versionIds = [...new Set(submissions.map((s) => s.form_version_id).filter(Boolean))];
  const roleMapByVersion = new Map<string, RoleMap>();
  for (const versionId of versionIds) {
    const { fields } = await loadFullVersion(supabase, versionId);
    roleMapByVersion.set(versionId, buildRoleMap(fields));
  }

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
    console.error("merged-analytics: fetch submission_answers batch failed", batchErrors);
  }

  const answersBySubmission = new Map<string, Record<string, unknown>>();
  for (const a of answers) {
    if (!answersBySubmission.has(a.submission_id)) answersBySubmission.set(a.submission_id, {});
    answersBySubmission.get(a.submission_id)![a.field_id] = a.value_json;
  }

  // -------------------------------------------------------------------------
  // Étape 3 : construction des enregistrements fusionnés
  // -------------------------------------------------------------------------
  const records: BuildingRecord[] = submissions.map((s) => {
    const roleMap = roleMapByVersion.get(s.form_version_id) ?? {};
    const indexed = answersBySubmission.get(s.id);
    const hasIndexed = indexed && Object.keys(indexed).length > 0;
    const snapshot = (s.answers_snapshot as Record<string, unknown> | null) ?? {};
    const source = hasIndexed ? indexed! : snapshot;

    const streetVal = roleMap.street ? source[roleMap.street] : undefined;
    const blockVal = roleMap.block ? source[roleMap.block] : undefined;
    const buildingNumberVal = roleMap.buildingNumber ? source[roleMap.buildingNumber] : undefined;
    const typeVal = roleMap.buildingType ? source[roleMap.buildingType] : undefined;
    const floorsVal = roleMap.floors ? source[roleMap.floors] : undefined;
    const statusVal = roleMap.status ? source[roleMap.status] : undefined;
    const locVal = roleMap.location ? source[roleMap.location] : undefined;
    const noteVal = roleMap.note ? source[roleMap.note] : undefined;

    let lat: number | null = null;
    let lng: number | null = null;
    if (locVal && typeof locVal === "object") {
      const loc = locVal as { latitude?: number; longitude?: number };
      if (typeof loc.latitude === "number") {
        lat = loc.latitude;
        lng = loc.longitude ?? null;
      }
    }

    return {
      street: typeof streetVal === "string" && streetVal ? streetVal : null,
      block: typeof blockVal === "string" && blockVal ? blockVal : null,
      buildingNumber:
        typeof buildingNumberVal === "string" && buildingNumberVal
          ? buildingNumberVal
          : typeof buildingNumberVal === "number"
            ? String(buildingNumberVal)
            : null,
      buildingTypes: Array.isArray(typeVal)
        ? typeVal.map(String)
        : typeof typeVal === "string" && typeVal
          ? [typeVal]
          : [],
      floors: typeof floorsVal === "string" && floorsVal ? floorsVal : null,
      statusCat: classifyOccupancy(statusVal),
      lat,
      lng,
      note: typeof noteVal === "string" && noteVal.trim() ? noteVal.trim() : null,
    };
  });

  const total = records.length;
  const streets = new Set(records.map((r) => r.street).filter(Boolean));
  const blocks = new Set(records.map((r) => r.block).filter(Boolean));
  const geolocated = records.filter((r) => r.lat !== null && r.lng !== null).length;

  const byStreet = countBy(records.map((r) => r.street));
  const byBlock = countBy(records.map((r) => r.block));
  const byFloors = countBy(records.map((r) => r.floors));
  const byType = countBy(records.flatMap((r) => r.buildingTypes));

  const statusCounts: Record<OccupancyStatus, number> = { occupied: 0, abandoned: 0, seasonal: 0, other: 0 };
  for (const r of records) statusCounts[r.statusCat]++;

  const statusByStreet = byStreet.map(({ label: street, count: streetTotal }) => {
    const counts: Record<OccupancyStatus, number> = { occupied: 0, abandoned: 0, seasonal: 0, other: 0 };
    for (const r of records) {
      if (r.street === street) counts[r.statusCat]++;
    }
    return { street, total: streetTotal, counts };
  });

  const mapPoints = records
    .filter((r) => r.lat !== null && r.lng !== null)
    .map((r, i) => ({
      id: String(i),
      lat: r.lat!,
      lng: r.lng!,
      street: r.street,
      block: r.block,
      buildingNumber: r.buildingNumber,
      buildingTypes: r.buildingTypes,
      floors: r.floors,
      statusCat: r.statusCat,
    }));

  const notes = records
    .filter((r) => r.note)
    .map((r, i) => ({
      id: String(i),
      text: r.note!,
      street: r.street,
      block: r.block,
      buildingNumber: r.buildingNumber,
    }));

  const submittedDates = submissions.map((s) => s.submitted_at).filter(Boolean).sort();
  const dateMin = submittedDates.length > 0 ? formatDate(submittedDates[0]) : null;
  const dateMax = submittedDates.length > 0 ? formatDate(submittedDates[submittedDates.length - 1]) : null;

  if (total === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-cairo)] text-2xl font-bold text-slate-900">
              جرد ميداني — {new Date().getFullYear()}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              دمج {selectedForms.length} نماذج: {selectedForms.map((f) => f.title).join("، ")}
            </p>
          </div>
          <Link href="/dashboard/merged-analytics">
            <Button variant="outline" size="sm">
              تغيير الاختيار
            </Button>
          </Link>
        </div>
        <EmptyState icon={Building2} title="لا توجد ردود بعد" description="لا توجد ردود في النماذج المختارة" />
      </div>
    );
  }

  const dashboardData: MergedDashboardData = {
    formTitles: selectedForms.map((f) => f.title),
    total,
    streetsCount: streets.size,
    blocksCount: blocks.size,
    geolocated,
    byStreet,
    byBlock,
    byFloors,
    byType,
    statusCounts,
    statusByStreet,
    mapPoints,
    notes,
    dateMin,
    dateMax,
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex justify-end">
        <Link href="/dashboard/merged-analytics">
          <Button variant="outline" size="sm">
            تغيير الاختيار
          </Button>
        </Link>
      </div>
      <MergedDashboardClient data={dashboardData} />
    </div>
  );
}
