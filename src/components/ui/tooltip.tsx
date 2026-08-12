"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils/cn";

export function Tooltip({ content, children }: { content: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      <span
        className={cn(
          "pointer-events-none absolute bottom-full right-1/2 z-50 mb-2 translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white transition-opacity",
          visible ? "opacity-100" : "opacity-0"
        )}
      >
        {content}
      </span>
    </span>
  );
}
