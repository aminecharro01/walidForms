"use client";

import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils/cn";

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setLocale("ar")}
        className={cn(
          "rounded-md px-2.5 py-1 transition-colors",
          locale === "ar" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"
        )}
      >
        العربية
      </button>
      <button
        type="button"
        onClick={() => setLocale("fr")}
        className={cn(
          "rounded-md px-2.5 py-1 transition-colors",
          locale === "fr" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"
        )}
      >
        Français
      </button>
    </div>
  );
}
