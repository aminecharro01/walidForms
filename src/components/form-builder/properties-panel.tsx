"use client";

import { Plus, Trash2, Settings2 } from "lucide-react";
import type { FormField } from "@/types/form";
import { FIELD_TYPE_LABELS_AR } from "@/types/form";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { generateId } from "@/lib/utils/id";

const OPTIONS_TYPES = ["radio", "checkbox", "select"];

export function PropertiesPanel({
  field,
  onChange,
}: {
  field: FormField | null;
  onChange: (patch: Partial<FormField>) => void;
}) {
  if (!field) {
    return (
      <div className="flex h-full flex-col items-center justify-center py-16 text-center text-slate-400">
        <Settings2 className="h-8 w-8" />
        <p className="mt-3 text-sm">اختر حقلاً لتعديل خصائصه</p>
      </div>
    );
  }

  function updateOption(optionId: string, label: string) {
    const options = (field!.options ?? []).map((o) =>
      o.id === optionId ? { ...o, label, value: label } : o
    );
    onChange({ options });
  }

  function addOption() {
    const options = [
      ...(field!.options ?? []),
      {
        id: generateId("opt"),
        field_id: field!.id,
        label: `خيار ${(field!.options?.length ?? 0) + 1}`,
        value: `خيار ${(field!.options?.length ?? 0) + 1}`,
        order_index: field!.options?.length ?? 0,
      },
    ];
    onChange({ options });
  }

  function removeOption(optionId: string) {
    onChange({ options: (field!.options ?? []).filter((o) => o.id !== optionId) });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-slate-400">نوع الحقل</p>
        <p className="mt-1 text-sm font-medium text-slate-700">{FIELD_TYPE_LABELS_AR[field.type]}</p>
      </div>

      <div>
        <Label>العنوان</Label>
        <Input value={field.label} onChange={(e) => onChange({ label: e.target.value })} />
      </div>

      <div>
        <Label>الوصف</Label>
        <Textarea
          rows={2}
          value={field.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="وصف اختياري يساعد المستخدم على فهم الحقل"
        />
      </div>

      {["short_text", "long_text", "number", "email"].includes(field.type) && (
        <div>
          <Label>النص التوضيحي</Label>
          <Input
            value={field.placeholder ?? ""}
            onChange={(e) => onChange({ placeholder: e.target.value })}
          />
        </div>
      )}

      {OPTIONS_TYPES.includes(field.type) && (
        <div>
          <Label>الخيارات</Label>
          <div className="space-y-2">
            {(field.options ?? []).map((option) => (
              <div key={option.id} className="flex items-center gap-2">
                <Input value={option.label} onChange={(e) => updateOption(option.id, e.target.value)} />
                <button
                  onClick={() => removeOption(option.id)}
                  className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="حذف الخيار"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-2 w-full" onClick={addOption}>
            <Plus className="h-4 w-4" /> إضافة خيار
          </Button>
        </div>
      )}

      <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-3">
        <span className="text-sm font-medium text-slate-700">حقل مطلوب</span>
        <input
          type="checkbox"
          checked={field.is_required}
          onChange={(e) => onChange({ is_required: e.target.checked })}
          className="h-4.5 w-4.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
      </label>
    </div>
  );
}
