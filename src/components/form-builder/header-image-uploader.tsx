"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/locale-context";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function HeaderImageUploader({
  formId,
  value,
  onChange,
}: {
  formId: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t("builder.headerImageTypeError"));
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(t("builder.headerImageSizeError"));
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${formId}/header-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("form-headers")
        .upload(path, file, { contentType: file.type, upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("form-headers").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch {
      setError(t("builder.headerImageError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">{t("builder.headerImage")}</p>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="flex items-center gap-1 text-xs text-red-600 hover:underline"
          >
            <X className="h-3 w-3" /> {t("builder.headerImageRemove")}
          </button>
        )}
      </div>

      {value ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative block w-full overflow-hidden rounded-xl border border-slate-200"
          style={{ aspectRatio: "1600 / 400" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/0 text-transparent transition-colors group-hover:bg-slate-900/40 group-hover:text-white">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : t("builder.headerImageChange")}
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 py-8 text-slate-400 transition-colors hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-600"
          style={{ aspectRatio: "1600 / 400" }}
        >
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
          <span className="text-xs">{t("builder.headerImageUpload")}</span>
        </button>
      )}

      <p className="text-xs text-slate-400">{t("builder.headerImageHint")}</p>
      {error && <p className="text-xs text-red-600">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
