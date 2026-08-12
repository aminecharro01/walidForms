import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="mt-5 font-[family-name:var(--font-cairo)] text-xl font-bold text-slate-900">
        الصفحة غير موجودة
      </h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
      </p>
      <Link href="/" className="mt-6">
        <Button variant="outline">العودة إلى الرئيسية</Button>
      </Link>
    </div>
  );
}
