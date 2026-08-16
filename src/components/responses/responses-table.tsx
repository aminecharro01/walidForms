"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, MapPin, ChevronRight, ChevronLeft, MessageSquare, Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { ExportButton } from "@/components/responses/export-button";
import { deleteAllSubmissionsAction, deleteSubmissionsAction } from "@/app/(dashboard)/dashboard/forms/[id]/responses/actions";
import { formatAnswerValue, formatDateFr } from "@/lib/utils/format";
import { useLocale } from "@/lib/i18n/locale-context";
import type { FormField } from "@/types/form";

interface SubmissionRow {
  id: string;
  submitted_at: string;
  answers: Record<string, unknown>;
  usingSnapshot?: boolean;
}

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 300;

export function ResponsesTable({
  fields,
  submissions,
  formId,
}: {
  fields: FormField[];
  submissions: SubmissionRow[];
  formId: string;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<SubmissionRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<"selected" | "all" | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const rows = useMemo(
    () => submissions.filter((s) => !deletedIds.has(s.id)),
    [submissions, deletedIds]
  );

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [search]);

  const displayFields = fields.slice(0, 4);

  const filtered = useMemo(() => {
    let result = rows;

    if (dateFrom) {
      const from = new Date(dateFrom).getTime();
      result = result.filter((s) => new Date(s.submitted_at).getTime() >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1;
      result = result.filter((s) => new Date(s.submitted_at).getTime() <= to);
    }

    const q = debouncedSearch.trim().toLowerCase();
    if (q) {
      result = result.filter((s) =>
        Object.values(s.answers).some((v) => formatAnswerValue(v).toLowerCase().includes(q))
      );
    }

    return result;
  }, [rows, debouncedSearch, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selectedIds.has(s.id));

  function resetToFirstPage() {
    setPage(1);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllFiltered() {
    setSelectedIds(allFilteredSelected ? new Set() : new Set(filtered.map((s) => s.id)));
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      if (pendingDelete === "all") {
        await deleteAllSubmissionsAction(formId);
        setDeletedIds(new Set(rows.map((r) => r.id)));
      } else {
        const ids = [...selectedIds];
        await deleteSubmissionsAction(formId, ids);
        setDeletedIds((prev) => new Set([...prev, ...ids]));
      }
      setSelectedIds(new Set());
      setPendingDelete(null);
      router.refresh();
    } catch {
      setDeleteError(t("resp.deleteError"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-xs">
            <Search className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder={t("resp.search")}
              className="pr-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                resetToFirstPage();
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              aria-label={t("resp.dateFrom")}
              className="w-auto"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                resetToFirstPage();
              }}
            />
            <span className="text-xs text-slate-400">{t("resp.to")}</span>
            <Input
              type="date"
              aria-label={t("resp.dateTo")}
              className="w-auto"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                resetToFirstPage();
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="danger" size="sm" onClick={() => setPendingDelete("selected")}>
              <Trash2 className="h-4 w-4" /> {t("resp.deleteSelected")} ({selectedIds.size})
            </Button>
          )}
          {rows.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setPendingDelete("all")}>
              <Trash2 className="h-4 w-4" /> {t("resp.deleteAll")}
            </Button>
          )}
          <ExportButton formId={formId} dateFrom={dateFrom || undefined} dateTo={dateTo || undefined} />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={MessageSquare} title={t("resp.noneYet")} description={t("resp.noneYetDesc")} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title={t("resp.noMatch")} description={t("resp.noMatchDesc")} />
      ) : (
        <>
          {/* Vue mobile : cartes */}
          <div className="space-y-3 sm:hidden">
            {paged.map((s, i) => (
              <div
                key={s.id}
                className="w-full rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(s.id)}
                      onChange={() => toggleSelect(s.id)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      aria-label={t("resp.selectOne")}
                    />
                    <span className="text-xs text-slate-400">
                      #{(page - 1) * PAGE_SIZE + i + 1}
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-slate-400" dir="ltr">
                    {s.usingSnapshot && (
                      <span title={t("resp.indexIncomplete")}>
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      </span>
                    )}
                    {formatDateFr(s.submitted_at)}
                  </span>
                </div>
                <button onClick={() => setDetail(s)} className="mt-2 w-full text-right">
                  <dl className="space-y-1.5">
                    {displayFields.map((f) => (
                      <div key={f.id} className="flex items-center justify-between gap-2 text-sm">
                        <dt className="shrink-0 text-slate-400">{f.label}</dt>
                        <dd className="truncate text-slate-700">
                          {f.type === "location" && s.answers[f.id] ? (
                            <span className="flex items-center gap-1 text-brand-600">
                              <MapPin className="h-3.5 w-3.5" /> {t("resp.locationSet")}
                            </span>
                          ) : (
                            formatAnswerValue(s.answers[f.id], f.type)
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </button>
              </div>
            ))}
          </div>

          {/* Vue bureau : tableau */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white sm:block">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="w-10 p-3">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      aria-label={t("resp.selectAll")}
                    />
                  </th>
                  <th className="p-3 font-medium">#</th>
                  {displayFields.map((f) => (
                    <th key={f.id} className="p-3 font-medium">
                      {f.label}
                    </th>
                  ))}
                  <th className="p-3 font-medium">{t("resp.date")}</th>
                  <th className="p-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.map((s, i) => (
                  <tr key={s.id} className="transition-colors hover:bg-slate-50">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        aria-label={t("resp.selectOne")}
                      />
                    </td>
                    <td className="p-3 text-slate-500">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    {displayFields.map((f) => (
                      <td key={f.id} className="max-w-[180px] truncate p-3 text-slate-700">
                        {f.type === "location" && s.answers[f.id] ? (
                          <span className="flex items-center gap-1 text-brand-600">
                            <MapPin className="h-3.5 w-3.5" /> {t("resp.locationSet")}
                          </span>
                        ) : (
                          formatAnswerValue(s.answers[f.id], f.type)
                        )}
                      </td>
                    ))}
                    <td className="whitespace-nowrap p-3 text-xs text-slate-400" dir="ltr">
                      <span className="flex items-center gap-1.5">
                        {s.usingSnapshot && (
                          <span title={t("resp.indexIncomplete")}>
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          </span>
                        )}
                        {formatDateFr(s.submitted_at)}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDetail(s)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedIds(new Set([s.id]));
                            setPendingDelete("selected");
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {t("resp.pageOf")} {page} / {totalPages} — {filtered.length} {t("forms.responseCount")}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronRight className="h-4 w-4" /> {t("resp.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("resp.next")} <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={t("resp.detailTitle")} size="md">
        {detail && (
          <div className="space-y-4">
            <p className="flex items-center gap-1.5 text-xs text-slate-400" dir="ltr">
              {formatDateFr(detail.submitted_at)}
            </p>
            {detail.usingSnapshot && (
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {t("resp.indexIncomplete")}
              </div>
            )}
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
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setSelectedIds(new Set([detail.id]));
                  setDetail(null);
                  setPendingDelete("selected");
                }}
              >
                <Trash2 className="h-4 w-4" /> {t("resp.deleteThis")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={pendingDelete !== null}
        onClose={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
        title={pendingDelete === "all" ? t("resp.deleteAllTitle") : t("resp.deleteSelectedTitle")}
        description={
          pendingDelete === "all"
            ? t("resp.deleteAllDesc")
            : `${t("resp.confirmDeleteCountPrefix")} ${selectedIds.size} ${t("forms.responseCount")}${t("resp.irreversibleSuffix")}`
        }
        size="sm"
      >
        <div className="space-y-3">
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setPendingDelete(null);
                setDeleteError(null);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} loading={deleting}>
              {t("forms.deleteFinal")}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
