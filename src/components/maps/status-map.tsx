"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const StatusMap = dynamic(() => import("./status-map-inner"), {
  ssr: false,
  loading: () => <Skeleton className="h-[480px] w-full" />,
});
