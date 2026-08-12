"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const ResponsesMap = dynamic(() => import("./responses-map-inner"), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full" />,
});
