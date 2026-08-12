import { Skeleton } from "@/components/ui/skeleton";

export default function FormsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="mt-3 h-4 w-1/2" />
            <Skeleton className="mt-4 h-6 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
