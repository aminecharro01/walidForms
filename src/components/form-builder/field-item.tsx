"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Copy, Trash2, MapPin, Upload } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FormField } from "@/types/form";

export function FieldItem({
  field,
  selected,
  onSelect,
  onDuplicate,
  onDelete,
}: {
  field: FormField;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "group relative rounded-xl border bg-white p-4 transition-all",
        selected ? "border-brand-400 ring-2 ring-brand-100" : "border-slate-200 hover:border-slate-300",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4.5 w-4.5" />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-slate-800">{field.label || "بدون عنوان"}</p>
            {field.is_required && <span className="text-red-500">*</span>}
          </div>
          {field.description && <p className="mt-0.5 text-xs text-slate-400">{field.description}</p>}

          <FieldPreview field={field} />
        </div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="تكرار"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldPreview({ field }: { field: FormField }) {
  switch (field.type) {
    case "short_text":
    case "email":
    case "number":
      return <div className="mt-2 h-9 w-full max-w-xs rounded-lg border border-slate-100 bg-slate-50" />;
    case "long_text":
      return <div className="mt-2 h-16 w-full rounded-lg border border-slate-100 bg-slate-50" />;
    case "date":
    case "time":
      return <div className="mt-2 h-9 w-40 rounded-lg border border-slate-100 bg-slate-50" />;
    case "radio":
    case "checkbox":
      return (
        <div className="mt-2 space-y-1.5">
          {(field.options ?? []).slice(0, 3).map((o) => (
            <div key={o.id} className="flex items-center gap-2 text-xs text-slate-400">
              <span
                className={cn(
                  "h-3.5 w-3.5 border border-slate-300",
                  field.type === "radio" ? "rounded-full" : "rounded"
                )}
              />
              {o.label}
            </div>
          ))}
        </div>
      );
    case "select":
      return (
        <div className="mt-2 flex h-9 w-full max-w-xs items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 text-xs text-slate-400">
          اختر...
        </div>
      );
    case "location":
      return (
        <div className="mt-2 flex w-fit items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs text-brand-600">
          <MapPin className="h-3.5 w-3.5" /> تحديد موقعي
        </div>
      );
    case "file":
      return (
        <div className="mt-2 flex w-fit items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-400">
          <Upload className="h-3.5 w-3.5" /> رفع ملف
        </div>
      );
    default:
      return null;
  }
}
