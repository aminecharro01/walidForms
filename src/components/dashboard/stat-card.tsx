import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "brand" | "emerald" | "amber" | "sky";
}) {
  const toneClasses = {
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600",
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", toneClasses[tone])}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="mt-3 font-[family-name:var(--font-cairo)] text-2xl font-bold text-slate-900">
        {value}
      </p>
    </Card>
  );
}
