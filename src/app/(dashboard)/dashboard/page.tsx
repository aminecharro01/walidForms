import Link from "next/link";
import { ClipboardList, CheckCircle2, MessageSquare, CalendarClock, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import type { FormStatus } from "@/types/form";
import { formatDateFr } from "@/lib/utils/format";
import { getServerT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();
  const { t } = await getServerT();
  const statusLabel: Record<FormStatus, string> = {
    draft: t("forms.statusDraft"),
    published: t("forms.statusPublished"),
    paused: t("forms.statusPaused"),
  };
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: forms } = await supabase
    .from("forms")
    .select("id, title, status, created_at")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  const formIds = (forms ?? []).map((f) => f.id);

  let totalSubmissions = 0;
  let todaySubmissions = 0;
  let recentSubmissions: { id: string; submitted_at: string; form_id: string }[] = [];

  if (formIds.length > 0) {
    const { count } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .in("form_id", formIds);
    totalSubmissions = count ?? 0;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .in("form_id", formIds)
      .gte("submitted_at", startOfToday.toISOString());
    todaySubmissions = todayCount ?? 0;

    const { data: recent } = await supabase
      .from("submissions")
      .select("id, submitted_at, form_id")
      .in("form_id", formIds)
      .order("submitted_at", { ascending: false })
      .limit(5);
    recentSubmissions = recent ?? [];
  }

  const totalForms = forms?.length ?? 0;
  const publishedForms = forms?.filter((f) => f.status === "published").length ?? 0;
  const formTitleById = new Map((forms ?? []).map((f) => [f.id, f.title]));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-[family-name:var(--font-cairo)] text-2xl font-bold text-slate-900">
          {t("dash.title")}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t("dash.subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={t("dash.totalForms")} value={totalForms} icon={ClipboardList} tone="brand" />
        <StatCard label={t("dash.publishedForms")} value={publishedForms} icon={CheckCircle2} tone="emerald" />
        <StatCard
          label={t("dash.totalResponses")}
          value={totalSubmissions.toLocaleString()}
          icon={MessageSquare}
          tone="sky"
        />
        <StatCard label={t("dash.todayResponses")} value={todaySubmissions} icon={CalendarClock} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between p-5 pb-0">
            <h2 className="font-[family-name:var(--font-cairo)] text-base font-semibold text-slate-900">
              {t("dash.recentForms")}
            </h2>
            <Link href="/dashboard/forms" className="flex items-center gap-1 text-sm text-brand-600 hover:underline">
              {t("dash.viewAll")} <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          <CardContent>
            {!forms || forms.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title={t("dash.noFormsYet")}
                description={t("dash.noFormsDesc")}
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {forms.slice(0, 5).map((form) => (
                  <li key={form.id} className="flex items-center justify-between py-3">
                    <Link href={`/dashboard/forms/${form.id}/edit`} className="text-sm font-medium text-slate-800 hover:text-brand-600">
                      {form.title}
                    </Link>
                    <Badge
                      tone={
                        form.status === "published" ? "green" : form.status === "paused" ? "amber" : "slate"
                      }
                    >
                      {statusLabel[form.status as FormStatus]}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <div className="p-5 pb-0">
            <h2 className="font-[family-name:var(--font-cairo)] text-base font-semibold text-slate-900">
              {t("dash.recentResponses")}
            </h2>
          </div>
          <CardContent>
            {recentSubmissions.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={t("dash.noResponsesYet")}
                description={t("dash.noResponsesDesc")}
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {recentSubmissions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/dashboard/forms/${s.form_id}/responses`}
                      className="flex items-center justify-between py-3 hover:text-brand-600"
                    >
                      <span className="text-sm text-slate-700">
                        {formTitleById.get(s.form_id) ?? "—"}
                      </span>
                      <span className="text-xs text-slate-400" dir="ltr">
                        {formatDateFr(s.submitted_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
