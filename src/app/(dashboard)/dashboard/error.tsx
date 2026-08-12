"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/error-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="حدث خطأ ما"
      description="تعذر تحميل هذه الصفحة، الرجاء المحاولة مرة أخرى."
      onRetry={reset}
    />
  );
}
