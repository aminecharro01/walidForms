"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
          <h1 className="text-xl font-bold text-slate-900">حدث خطأ غير متوقع</h1>
          <p className="mt-2 text-sm text-slate-500">الرجاء إعادة تحميل الصفحة أو المحاولة لاحقاً.</p>
          <button
            onClick={reset}
            className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
