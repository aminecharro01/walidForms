"use client";

import { Plus, Trash2, GitBranch } from "lucide-react";
import type { FormField } from "@/types/form";
import type { Condition, ConditionOperator, ConditionAction } from "@/types/condition";
import { CONDITION_OPERATOR_LABELS_AR, CONDITION_ACTION_LABELS_AR } from "@/types/condition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { generateId } from "@/lib/utils/id";

const OPERATORS: ConditionOperator[] = [
  "equals",
  "not_equals",
  "contains",
  "greater_than",
  "less_than",
  "greater_or_equal",
  "less_or_equal",
  "is_empty",
  "is_not_empty",
];

const ACTIONS: ConditionAction[] = ["show", "hide"];

export function ConditionBuilder({
  fields,
  conditions,
  onAdd,
  onUpdate,
  onDelete,
}: {
  fields: FormField[];
  conditions: Condition[];
  onAdd: (condition: Condition) => void;
  onUpdate: (id: string, patch: Partial<Condition>) => void;
  onDelete: (id: string) => void;
}) {
  function handleAdd() {
    if (fields.length < 2) return;
    onAdd({
      id: generateId("cond"),
      form_version_id: "",
      source_field_id: fields[0].id,
      operator: "equals",
      value: "",
      action: "show",
      target_field_id: fields[1]?.id ?? fields[0].id,
    });
  }

  if (fields.length < 2) {
    return (
      <EmptyState
        icon={GitBranch}
        title="أضف حقلين على الأقل"
        description="تحتاج إلى حقلين على الأقل لإنشاء قاعدة منطق شرطي"
      />
    );
  }

  return (
    <div className="space-y-4">
      {conditions.length === 0 && (
        <EmptyState
          icon={GitBranch}
          title="لا توجد قواعد بعد"
          description="أنشئ قاعدة لإظهار أو إخفاء حقل بناءً على إجابة حقل آخر"
        />
      )}

      {conditions.map((condition) => (
        <div key={condition.id} className="rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-slate-500">إذا</span>
            <select
              value={condition.source_field_id}
              onChange={(e) => onUpdate(condition.id, { source_field_id: e.target.value })}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>

            <select
              value={condition.operator}
              onChange={(e) =>
                onUpdate(condition.id, { operator: e.target.value as ConditionOperator })
              }
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            >
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {CONDITION_OPERATOR_LABELS_AR[op]}
                </option>
              ))}
            </select>

            {!["is_empty", "is_not_empty"].includes(condition.operator) && (
              <Input
                value={condition.value ?? ""}
                onChange={(e) => onUpdate(condition.id, { value: e.target.value })}
                placeholder="القيمة"
                className="h-9 w-32"
              />
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium text-slate-500">إذن</span>
            <select
              value={condition.action}
              onChange={(e) => onUpdate(condition.id, { action: e.target.value as ConditionAction })}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            >
              {ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {CONDITION_ACTION_LABELS_AR[a]}
                </option>
              ))}
            </select>
            <select
              value={condition.target_field_id}
              onChange={(e) => onUpdate(condition.id, { target_field_id: e.target.value })}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            >
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => onDelete(condition.id)}
              className="mr-auto rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" className="w-full" onClick={handleAdd}>
        <Plus className="h-4 w-4" /> إضافة قاعدة جديدة
      </Button>
    </div>
  );
}
