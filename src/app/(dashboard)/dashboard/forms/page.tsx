import Link from "next/link";
import { ClipboardList, ClipboardPlus, MessageSquare, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FormCardMenu } from "@/components/dashboard/form-card-menu";
import { FORM_STATUS_LABELS_AR, type FormStatus } from "@/types/form";

export const dynamic = "force-dynamic";

export default async function FormsListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: forms } = await supabase
    .from("forms")
    .select("id, title, description, status, created_at, updated_at")
    .eq("owner_id", user!.id)
    .order("updated_at", { ascending: false });

  const formIds = (forms ?? []).map((f) => f.id);
  const counts = new Map<string, number>();

  if (formIds.length > 0) {
    const { data: submissionRows } = await supabase
      .from("submissions")
      .select("form_id")
      .in("form_id", formIds);
    for (const row of submissionRows ?? []) {
      counts.set(row.form_id, (counts.get(row.form_id) ?? 0) + 1);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-cairo)] text-2xl font-bold text-slate-900">
            النماذج
          </h1>
          <p className="mt-1 text-sm text-slate-500">إدارة جميع نماذجك في مكان واحد</p>
        </div>
        <Link href="/dashboard/forms/create">
          <Button>
            <ClipboardPlus className="h-4 w-4" />
            نموذج جديد
          </Button>
        </Link>
      </div>

      {!forms || forms.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="لا توجد نماذج بعد"
          description="أنشئ نموذجك الأول لتبدأ في جمع البيانات من المستخدمين"
          action={
            <Link href="/dashboard/forms/create">
              <Button>
                <ClipboardPlus className="h-4 w-4" />
                إنشاء نموذج
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card key={form.id} className="flex flex-col p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/dashboard/forms/${form.id}/edit`} className="min-w-0 flex-1">
                  <h3 className="truncate font-[family-name:var(--font-cairo)] text-base font-semibold text-slate-900 hover:text-brand-600">
                    {form.title}
                  </h3>
                </Link>
                <FormCardMenu formId={form.id} status={form.status as FormStatus} />
              </div>
              {form.description && (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{form.description}</p>
              )}
              <div className="mt-3">
                <Badge
                  tone={form.status === "published" ? "green" : form.status === "paused" ? "amber" : "slate"}
                >
                  {FORM_STATUS_LABELS_AR[form.status as FormStatus]}
                </Badge>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
                <Link
                  href={`/dashboard/forms/${form.id}/responses`}
                  className="flex items-center gap-1.5 hover:text-brand-600 hover:underline"
                >
                  <MessageSquare className="h-4 w-4" />
                  {counts.get(form.id) ?? 0} رد
                </Link>
                <Link
                  href={`/dashboard/forms/${form.id}/analytics`}
                  className="flex items-center gap-1.5 text-brand-600 hover:underline"
                >
                  <BarChart3 className="h-4 w-4" />
                  التحليلات
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
