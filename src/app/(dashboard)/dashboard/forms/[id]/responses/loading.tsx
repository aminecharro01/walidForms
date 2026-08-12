import { SkeletonTable } from "@/components/ui/skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResponsesLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-48" />
      </div>
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
