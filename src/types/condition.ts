// نوع قواعد المنطق الشرطي / Conditional logic types

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "greater_than"
  | "less_than"
  | "greater_or_equal"
  | "less_or_equal"
  | "is_empty"
  | "is_not_empty";

export const CONDITION_OPERATOR_LABELS_AR: Record<ConditionOperator, string> = {
  equals: "يساوي",
  not_equals: "لا يساوي",
  contains: "يحتوي على",
  greater_than: "أكبر من",
  less_than: "أصغر من",
  greater_or_equal: "أكبر أو يساوي",
  less_or_equal: "أصغر أو يساوي",
  is_empty: "فارغ",
  is_not_empty: "غير فارغ",
};

export type ConditionAction = "show" | "hide";

export const CONDITION_ACTION_LABELS_AR: Record<ConditionAction, string> = {
  show: "إظهار",
  hide: "إخفاء",
};

export interface Condition {
  id: string;
  form_version_id: string;
  source_field_id: string;
  operator: ConditionOperator;
  value: string | number | null;
  action: ConditionAction;
  target_field_id: string;
}
