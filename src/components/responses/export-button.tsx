"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/locale-context";

function extractFilename(disposition: string | null, fallback: string): string {
  if (!disposition) return fallback;
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : fallback;
}

export function ExportButton({
  formId,
  dateFrom,
  dateTo,
}: {
  formId: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function handleExport() {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo) params.set("to", dateTo);
      const qs = params.toString();

      const res = await fetch(`/api/forms/${formId}/export${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("export failed");

      const blob = await res.blob();
      const filename = extractFilename(res.headers.get("Content-Disposition"), "responses.xlsx");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={handleExport} loading={loading}>
        <Download className="h-4 w-4" /> {t("resp.export")}
      </Button>
      {error && <span className="text-xs text-red-600">{t("resp.exportError")}</span>}
    </div>
  );
}
