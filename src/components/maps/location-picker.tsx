"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

export const LocationPickerMap = dynamic(() => import("./location-picker-map"), {
  ssr: false,
  loading: () => <Skeleton className="h-[220px] w-full" />,
});
