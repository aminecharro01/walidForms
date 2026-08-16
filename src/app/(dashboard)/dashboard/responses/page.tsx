import Link from "next/link";
import { MessageSquare, ChevronRight, ChevronLeft, Combine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateFr } from "@/lib/utils/format";
import { getServerT } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AllResponsesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const supabase = await createClient();
  const { t } = await getServerT();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: forms } = await supabase
    .from("forms")
    .select("id, title")
    .eq("owner_id", user!.id);

  const formIds = (forms ?? []).map((f) => f.id);
  const formTitleById = new Map((forms ?? []).map((f) => [f.id, f.title]));

  let submissions: { id: string; form_id: string; submitted_at: string }[] = [];
  let total = 0;

  if (formIds.length > 0) {
    const { data, count } = await supabase
      .from("submissions")
      .select("id, form_id, submitted_at", { count: "exact" })
      .in("form_id", formIds)
      .order("submitted_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    submissions = data ?? [];
    total = count ?? 0;
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-cairo)] text-2xl font-bold text-slate-900">
            {t("resp.allTitle")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {t("resp.allSubtitle")} — {total.toLocaleString()} {t("forms.responseCount")}
          </p>
        </div>
        <Link href="/dashboard/merged-analytics">
          <Button variant="outline" size="sm">
            <Combine className="h-4 w-4" /> {t("nav.mergedAnalytics")}
          </Button>
        </Link>
      </div>

      {submissions.length === 0 ? (
        <EmptyState icon={MessageSquare} title={t("resp.noneYet")} description={t("resp.noneYetDesc")} />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="divide-y divide-slate-100">
            {submissions.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/forms/${s.form_id}/responses`}
                className="flex items-center justify-between p-4 transition-colors hover:bg-slate-50"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <MessageSquare className="h-4 w-4 text-slate-400" />
                  {formTitleById.get(s.form_id) ?? "—"}
                </span>
                <span className="text-xs text-slate-400" dir="ltr">
                  {formatDateFr(s.submitted_at)}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            {t("resp.pageOf")} {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/responses?page=${page - 1}`}
              aria-disabled={page === 1}
              className={page === 1 ? "pointer-events-none" : undefined}
            >
              <Button variant="outline" size="sm" disabled={page === 1}>
                <ChevronRight className="h-4 w-4" /> {t("resp.previous")}
              </Button>
            </Link>
            <Link
              href={`/dashboard/responses?page=${page + 1}`}
              aria-disabled={page === totalPages}
              className={page === totalPages ? "pointer-events-none" : undefined}
            >
              <Button variant="outline" size="sm" disabled={page === totalPages}>
                {t("resp.next")} <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
