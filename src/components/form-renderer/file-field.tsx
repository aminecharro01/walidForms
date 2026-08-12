"use client";

import { useRef } from "react";
import { Upload, X, FileText } from "lucide-react";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function FileField({
  value,
  onChange,
  onError,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
  onError?: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      onError?.("حجم الملف كبير جداً، الحد الأقصى 10 ميجابايت");
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.("نوع الملف غير مدعوم");
      return;
    }
    onChange(file);
  }

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <div className="flex items-center gap-2.5 text-sm text-slate-700">
          <FileText className="h-4.5 w-4.5 text-brand-600" />
          <span className="truncate max-w-[200px]">{value.name}</span>
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-slate-400 transition-colors hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-600"
    >
      <Upload className="h-6 w-6" />
      <span className="text-sm">اضغط لرفع ملف (حتى 10 ميجابايت)</span>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ALLOWED_TYPES.join(",")}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </button>
  );
}
