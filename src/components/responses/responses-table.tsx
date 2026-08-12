"use client";

import { useMemo, useState } from "react";
import { Search, Eye, MapPin, ChevronRight, ChevronLeft, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageSquare } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { formatAnswerValue, formatDateAr } from "@/lib/utils/format";
import type { FormField } from "@/types/form";

interface SubmissionRow {
  id: string;
  submitted_at: string;
  answers: Record<string, unknown>;
}

const PAGE_SIZE = 10;

export function ResponsesTable({
  fields,
  submissions,
  formId,
}: {
  fields: FormField[];
  submissions: SubmissionRow[];
  formId: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<SubmissionRow | null>(null);

  const displayFields = fields.slice(0, 4);

  const filtered = useMemo(() => {
    if (!search.trim()) return submissions;
    const q = search.toLowerCase();
    return submissions.filter((s) =>
      Object.values(s.answers).some((v) => formatAnswerValue(v).toLowerCase().includes(q))
    );
  }, [submissions, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="لا توجد ردود بعد"
        description="ستظهر هنا الردود فور استلامها من المستخدمين"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs">
          <Search className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="بحث في الردود..."
            className="pr-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <a href={`/api/forms/${formId}/export`}>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> تصدير إلى Excel
          </Button>
        </a>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-400">
              <th className="p-3 font-medium">#</th>
              {displayFields.map((f) => (
                <th key={f.id} className="p-3 font-medium">
                  {f.label}
                </th>
              ))}
              <th className="p-3 font-medium">التاريخ</th>
              <th className="p-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map((s, i) => (
              <tr key={s.id} className="transition-colors hover:bg-slate-50">
                <td className="p-3 text-slate-500">{(page - 1) * PAGE_SIZE + i + 1}</td>
                {displayFields.map((f) => (
                  <td key={f.id} className="max-w-[180px] truncate p-3 text-slate-700">
                    {f.type === "location" && s.answers[f.id] ? (
                      <span className="flex items-center gap-1 text-brand-600">
                        <MapPin className="h-3.5 w-3.5" /> محدد
                      </span>
                    ) : (
                      formatAnswerValue(s.answers[f.id], f.type)
                    )}
                  </td>
                ))}
                <td className="whitespace-nowrap p-3 text-xs text-slate-400" dir="ltr">
                  {formatDateAr(s.submitted_at)}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => setDetail(s)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            صفحة {page} من {totalPages} — {filtered.length} رد
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronRight className="h-4 w-4" /> السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              التالي <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="تفاصيل الرد" size="md">
        {detail && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400" dir="ltr">
              {formatDateAr(detail.submitted_at)}
            </p>
            <dl className="divide-y divide-slate-100">
              {fields.map((f) => (
                <div key={f.id} className="py-2.5">
                  <dt className="text-xs font-medium text-slate-400">{f.label}</dt>
                  <dd className="mt-0.5 text-sm text-slate-800">
                    {formatAnswerValue(detail.answers[f.id], f.type)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </Modal>
    </div>
  );
}
