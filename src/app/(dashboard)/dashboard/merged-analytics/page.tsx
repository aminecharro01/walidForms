import Link from "next/link";
import {
  Building2,
  Route,
  Blocks,
  MapPin,
  ArrowRight,
  StickyNote,
  Layers,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadFullVersion } from "@/lib/supabase/forms";
import { fetchAllInBatches, FETCH_PAGE_SIZE } from "@/lib/supabase/fetch-in-batches";
import {
  findFieldByKeywords,
  classifyOccupancy,
  OCCUPANCY_LABELS_AR,
  OCCUPANCY_COLORS,
  type OccupancyStatus,
} from "@/lib/analytics/merge-helpers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { DistributionBarChart } from "@/components/charts/distribution-bar-chart";
import { StatusMap } from "@/components/maps/status-map";
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
  buildingType?: string;
  floors?: string;
  status?: string;
  location?: string;
  note?: string;
}

interface BuildingRecord {
  street: string | null;
  block: string | null;
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
  }[] = [];
  {
    let offset = 0;
    while (true) {
      const { data } = await supabase
        .from("submissions")
        .select("id, form_id, form_version_id, answers_snapshot")
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
      label: [r.street, r.block].filter(Boolean).join(" — ") || "بناية",
      color: OCCUPANCY_COLORS[r.statusCat],
    }));

  const notes = records
    .filter((r) => r.note)
    .map((r, i) => ({ id: String(i), text: r.note!, street: r.street, block: r.block }));

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
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            لوحة تحليلية تلخّص نتائج المسح الميداني المُجمّع من النماذج المختارة.
          </p>
        </div>
        <Link href="/dashboard/merged-analytics">
          <Button variant="outline" size="sm">
            <ArrowRight className="h-4 w-4" /> تغيير الاختيار
          </Button>
        </Link>
      </div>

      {total === 0 ? (
        <EmptyState icon={Building2} title="لا توجد ردود بعد" description="لا توجد ردود في النماذج المختارة" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="إجمالي البنايات المجرودة" value={total.toLocaleString()} icon={Building2} tone="brand" />
            <StatCard label="درب داخل المدينة العتيقة" value={streets.size} icon={Route} tone="sky" />
            <StatCard label="جزيرة عقارية" value={blocks.size} icon={Blocks} tone="amber" />
            <StatCard label="بناية مُحدَّدة الموقع" value={geolocated.toLocaleString()} icon={MapPin} tone="emerald" />
          </div>

          {/* 01 — التوزيع الجغرافي والإداري */}
          <section className="space-y-4">
            <SectionHeader
              num="01"
              title="التوزيع الجغرافي والإداري"
              desc={`توزّع البنايات المجرودة على ${streets.size} دروب و${blocks.size} جزر داخل النسيج العتيق للمدينة.`}
            />
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-5">
                <h3 className="mb-4 font-[family-name:var(--font-cairo)] text-sm font-semibold text-slate-900">
                  عدد البنايات حسب الدرب
                </h3>
                <p className="mb-3 text-xs text-slate-400">مرتّبة تنازليًا حسب عدد البنايات المرصودة في كل درب</p>
                {byStreet.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">لا توجد بيانات</p>
                ) : (
                  <DistributionBarChart data={byStreet} />
                )}
              </Card>
              <Card className="p-5">
                <h3 className="mb-4 font-[family-name:var(--font-cairo)] text-sm font-semibold text-slate-900">
                  عدد البنايات حسب الجزيرة
                </h3>
                <p className="mb-3 text-xs text-slate-400">الجزر العقارية المشمولة بالجرد</p>
                {byBlock.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">لا توجد بيانات</p>
                ) : (
                  <DistributionBarChart data={byBlock} />
                )}
              </Card>
            </div>
          </section>

          {/* 02 — خصائص البنايات */}
          <section className="space-y-4">
            <SectionHeader
              num="02"
              title="خصائص البنايات"
              desc="صنف البناية، عدد الطوابق، والحالة الوظيفية للمسكن (مسكون، مهجور، أو موسمي)."
            />
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="p-5">
                <h3 className="mb-1 font-[family-name:var(--font-cairo)] text-sm font-semibold text-slate-900">
                  صنف البناية
                </h3>
                <p className="mb-3 text-xs text-slate-400">تقليدية مقابل عصرية ومرافق أخرى</p>
                {byType.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">لا توجد بيانات</p>
                ) : (
                  <DistributionBarChart data={byType} />
                )}
              </Card>
              <Card className="p-5">
                <h3 className="mb-1 font-[family-name:var(--font-cairo)] text-sm font-semibold text-slate-900">
                  عدد الطوابق
                </h3>
                <p className="mb-3 text-xs text-slate-400">توزيع الارتفاع العمراني للبنايات</p>
                {byFloors.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">لا توجد بيانات</p>
                ) : (
                  <DistributionBarChart data={byFloors} />
                )}
              </Card>
              <Card className="p-5">
                <h3 className="mb-1 font-[family-name:var(--font-cairo)] text-sm font-semibold text-slate-900">
                  الحالة الوظيفية للمسكن
                </h3>
                <p className="mb-3 text-xs text-slate-400">نسبة السكن الدائم مقابل الهجرة والسكن الموسمي</p>
                <StatusBreakdown counts={statusCounts} total={total} />
              </Card>
            </div>
          </section>

          {/* 03 — الحالة الوظيفية حسب الدرب */}
          <section className="space-y-4">
            <SectionHeader
              num="03"
              title="الحالة الوظيفية حسب الدرب"
              desc="مقارنة نسب السكن الدائم والهجران والسكن الموسمي داخل كل درب — تكشف الدروب الأكثر تضررًا من الهجرة العمرانية."
            />
            <Card className="space-y-4 p-5">
              {statusByStreet.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">لا توجد بيانات</p>
              ) : (
                statusByStreet.map(({ street, total: streetTotal, counts }) => (
                  <StackedStatusRow key={street} label={street} total={streetTotal} counts={counts} />
                ))
              )}
            </Card>
          </section>

          {/* 04 — الخريطة التفاعلية */}
          <section className="space-y-4">
            <SectionHeader
              num="04"
              title="الخريطة التفاعلية للبنايات"
              desc={`تم تحديد الموقع الجغرافي لـ ${geolocated} بناية من أصل ${total} (${total - geolocated} بنايات بدون إحداثيات).`}
            />
            <Card className="p-5">
              <div className="mb-4 flex flex-wrap items-center gap-4 text-xs">
                {(Object.keys(OCCUPANCY_LABELS_AR) as OccupancyStatus[])
                  .filter((k) => k !== "other")
                  .map((k) => (
                    <span key={k} className="flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: OCCUPANCY_COLORS[k] }}
                      />
                      {OCCUPANCY_LABELS_AR[k]}
                    </span>
                  ))}
              </div>
              {mapPoints.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">لا توجد إحداثيات مسجَّلة</p>
              ) : (
                <StatusMap points={mapPoints} />
              )}
            </Card>
          </section>

          {/* 05 — ملاحظات ميدانية */}
          <section className="space-y-4">
            <SectionHeader
              num="05"
              title="ملاحظات ميدانية"
              desc="ملاحظات مسجَّلة من طرف فرق الجرد الميداني حول بنايات محدَّدة (محلات تجارية، بنايات آيلة للسقوط...)."
            />
            <Card className="divide-y divide-slate-100 p-0">
              {notes.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">لا توجد ملاحظات مسجَّلة</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-4">
                    <StickyNote className="h-4 w-4 shrink-0 text-amber-500" />
                    <div>
                      <p className="text-sm text-slate-700">{n.text}</p>
                      {(n.street || n.block) && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {[n.street, n.block].filter(Boolean).join(" — ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}

function SectionHeader({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
        {num}
      </span>
      <div>
        <h2 className="font-[family-name:var(--font-cairo)] text-base font-semibold text-slate-900">{title}</h2>
        <p className="mt-0.5 text-sm text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function StatusBreakdown({ counts, total }: { counts: Record<OccupancyStatus, number>; total: number }) {
  const order: OccupancyStatus[] = ["occupied", "abandoned", "seasonal", "other"];
  return (
    <div className="space-y-3">
      {order
        .filter((k) => counts[k] > 0)
        .map((k) => {
          const pct = total > 0 ? Math.round((counts[k] / total) * 100) : 0;
          return (
            <div key={k}>
              <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                <span>{OCCUPANCY_LABELS_AR[k]}</span>
                <span className="font-medium" dir="ltr">
                  {counts[k]} ({pct}%)
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: OCCUPANCY_COLORS[k] }}
                />
              </div>
            </div>
          );
        })}
    </div>
  );
}

function StackedStatusRow({
  label,
  total,
  counts,
}: {
  label: string;
  total: number;
  counts: Record<OccupancyStatus, number>;
}) {
  const order: OccupancyStatus[] = ["occupied", "abandoned", "seasonal", "other"];
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-xs text-slate-400" dir="ltr">
          {total}
        </span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {order
          .filter((k) => counts[k] > 0)
          .map((k) => (
            <div
              key={k}
              style={{ width: `${(counts[k] / total) * 100}%`, backgroundColor: OCCUPANCY_COLORS[k] }}
              title={`${OCCUPANCY_LABELS_AR[k]}: ${counts[k]}`}
            />
          ))}
      </div>
    </div>
  );
}
