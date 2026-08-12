import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

export function ErrorState({
  title = "حدث خطأ ما",
  description = "تعذر تحميل البيانات، الرجاء المحاولة مرة أخرى.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-[family-name:var(--font-cairo)] text-base font-semibold text-slate-900">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">{description}</p>
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          إعادة المحاولة
        </Button>
      )}
    </div>
  );
}
