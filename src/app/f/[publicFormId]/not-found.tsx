import { FileQuestion } from "lucide-react";

export default function PublicFormNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="mt-5 font-[family-name:var(--font-cairo)] text-xl font-bold text-slate-900">
        النموذج غير متاح
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        هذا النموذج غير موجود أو تم إيقافه من قبل صاحبه.
      </p>
    </div>
  );
}
