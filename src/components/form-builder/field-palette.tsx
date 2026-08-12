"use client";

import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Calendar,
  Clock,
  CircleDot,
  CheckSquare,
  ChevronDown,
  MapPin,
  Upload,
} from "lucide-react";
import type { FieldType } from "@/types/form";
import { FIELD_TYPE_LABELS_AR } from "@/types/form";

const groups: { title: string; items: { type: FieldType; icon: typeof Type }[] }[] = [
  {
    title: "نص",
    items: [
      { type: "short_text", icon: Type },
      { type: "long_text", icon: AlignLeft },
    ],
  },
  {
    title: "بيانات",
    items: [
      { type: "number", icon: Hash },
      { type: "email", icon: Mail },
      { type: "date", icon: Calendar },
      { type: "time", icon: Clock },
    ],
  },
  {
    title: "خيارات",
    items: [
      { type: "radio", icon: CircleDot },
      { type: "checkbox", icon: CheckSquare },
      { type: "select", icon: ChevronDown },
    ],
  },
  {
    title: "متقدم",
    items: [
      { type: "location", icon: MapPin },
      { type: "file", icon: Upload },
    ],
  },
];

export function FieldPalette({ onAdd }: { onAdd: (type: FieldType) => void }) {
  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <div key={group.title}>
          <h4 className="mb-2 px-1 text-xs font-semibold text-slate-400">{group.title}</h4>
          <div className="space-y-1">
            {group.items.map((item) => (
              <button
                key={item.type}
                onClick={() => onAdd(item.type)}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-right text-sm font-medium text-slate-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {FIELD_TYPE_LABELS_AR[item.type]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
