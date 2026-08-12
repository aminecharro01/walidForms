import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "slate" | "green" | "amber" | "red" | "indigo";

const toneClasses: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  indigo: "bg-indigo-100 text-indigo-700",
};

export function Badge({
  className,
  tone = "slate",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
