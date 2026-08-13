"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreVertical, Copy, Trash2, Eye, Pause, Play, Share2, MessageSquare } from "lucide-react";
import { Dropdown, DropdownItem } from "@/components/ui/dropdown";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { deleteFormAction, duplicateFormAction, updateFormStatusAction } from "@/app/(dashboard)/dashboard/forms/actions";
import type { FormStatus } from "@/types/form";

export function FormCardMenu({ formId, status }: { formId: string; status: FormStatus }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    setLoading(true);
    await duplicateFormAction(formId);
    router.refresh();
    setLoading(false);
  }

  async function handleToggleStatus() {
    setLoading(true);
    await updateFormStatusAction(formId, status === "published" ? "paused" : "published");
    router.refresh();
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    await deleteFormAction(formId);
    setConfirmDelete(false);
    router.refresh();
    setLoading(false);
  }

  return (
    <>
      <Dropdown trigger={<Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>}>
        <DropdownItem onClick={() => router.push(`/dashboard/forms/${formId}/edit`)}>
          <Eye className="h-4 w-4" /> تعديل ومعاينة
        </DropdownItem>
        <DropdownItem onClick={() => router.push(`/dashboard/forms/${formId}/responses`)}>
          <MessageSquare className="h-4 w-4" /> عرض الردود
        </DropdownItem>
        {status !== "draft" && (
          <DropdownItem onClick={() => router.push(`/dashboard/forms/${formId}/share`)}>
            <Share2 className="h-4 w-4" /> مشاركة
          </DropdownItem>
        )}
        <DropdownItem onClick={handleDuplicate} disabled={loading}>
          <Copy className="h-4 w-4" /> تكرار النموذج
        </DropdownItem>
        {status === "published" ? (
          <DropdownItem onClick={handleToggleStatus} disabled={loading}>
            <Pause className="h-4 w-4" /> إيقاف مؤقت
          </DropdownItem>
        ) : status === "paused" ? (
          <DropdownItem onClick={handleToggleStatus} disabled={loading}>
            <Play className="h-4 w-4" /> إعادة النشر
          </DropdownItem>
        ) : null}
        <DropdownItem danger onClick={() => setConfirmDelete(true)}>
          <Trash2 className="h-4 w-4" /> حذف النموذج
        </DropdownItem>
      </Dropdown>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="حذف النموذج"
        description="هل أنت متأكد من حذف هذا النموذج؟ سيتم حذف جميع الردود المرتبطة به بشكل نهائي ولا يمكن التراجع عن هذا الإجراء."
        size="sm"
      >
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            إلغاء
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={loading}>
            حذف نهائياً
          </Button>
        </div>
      </Modal>
    </>
  );
}
