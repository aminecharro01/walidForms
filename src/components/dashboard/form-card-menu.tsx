"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreVertical, Copy, Trash2, Eye, Pause, Play, Share2, MessageSquare, Loader2 } from "lucide-react";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { deleteFormAction, duplicateFormAction, updateFormStatusAction } from "@/app/(dashboard)/dashboard/forms/actions";
import type { FormStatus } from "@/types/form";
import { useLocale } from "@/lib/i18n/locale-context";

export function FormCardMenu({ formId, status }: { formId: string; status: FormStatus }) {
  const router = useRouter();
  const { t } = useLocale();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDuplicate() {
    setLoading(true);
    setError(null);
    try {
      await duplicateFormAction(formId);
      router.refresh();
    } catch {
      setError(t("forms.errorDuplicate"));
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus() {
    setLoading(true);
    setError(null);
    try {
      await updateFormStatusAction(formId, status === "published" ? "paused" : "published");
      router.refresh();
    } catch {
      setError(t("forms.errorStatus"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      await deleteFormAction(formId);
      setConfirmDelete(false);
      router.refresh();
    } catch {
      setError(t("forms.errorDelete"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative inline-block">
      <Dropdown
        trigger={
          <Button variant="ghost" size="icon" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
          </Button>
        }
      >
        <DropdownItem onClick={() => router.push(`/dashboard/forms/${formId}/edit`)} disabled={loading}>
          <Eye className="h-4 w-4" /> {t("forms.menu.editPreview")}
        </DropdownItem>
        <DropdownItem onClick={() => router.push(`/dashboard/forms/${formId}/responses`)} disabled={loading}>
          <MessageSquare className="h-4 w-4" /> {t("forms.menu.viewResponses")}
        </DropdownItem>
        {status !== "draft" && (
          <DropdownItem onClick={() => router.push(`/dashboard/forms/${formId}/share`)} disabled={loading}>
            <Share2 className="h-4 w-4" /> {t("forms.menu.share")}
          </DropdownItem>
        )}
        <DropdownItem onClick={handleDuplicate} disabled={loading}>
          <Copy className="h-4 w-4" /> {t("forms.menu.duplicate")}
        </DropdownItem>
        {status === "published" ? (
          <DropdownItem onClick={handleToggleStatus} disabled={loading}>
            <Pause className="h-4 w-4" /> {t("forms.menu.pause")}
          </DropdownItem>
        ) : status === "paused" ? (
          <DropdownItem onClick={handleToggleStatus} disabled={loading}>
            <Play className="h-4 w-4" /> {t("forms.menu.republish")}
          </DropdownItem>
        ) : null}
        <DropdownItem danger onClick={() => setConfirmDelete(true)} disabled={loading}>
          <Trash2 className="h-4 w-4" /> {t("forms.menu.delete")}
        </DropdownItem>
      </Dropdown>

      {error && (
        <p className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-lg bg-red-50 px-2.5 py-1 text-xs text-red-600 shadow-sm">
          {error}
        </p>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title={t("forms.deleteConfirmTitle")}
        description={t("forms.deleteConfirmDesc")}
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            {t("common.cancel")}
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={loading}>
            {t("forms.deleteFinal")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
