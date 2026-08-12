"use client";

import { useReducer } from "react";
import type { FormField, FieldOption, FieldType } from "@/types/form";
import type { Condition } from "@/types/condition";
import { generateId } from "@/lib/utils/id";
import { FIELD_TYPE_LABELS_AR } from "@/types/form";

export interface BuilderState {
  fields: FormField[];
  conditions: Condition[];
  selectedFieldId: string | null;
  dirty: boolean;
}

type Action =
  | { type: "ADD_FIELD"; fieldType: FieldType; index?: number }
  | { type: "UPDATE_FIELD"; fieldId: string; patch: Partial<FormField> }
  | { type: "DELETE_FIELD"; fieldId: string }
  | { type: "DUPLICATE_FIELD"; fieldId: string }
  | { type: "REORDER_FIELDS"; fields: FormField[] }
  | { type: "SELECT_FIELD"; fieldId: string | null }
  | { type: "SET_OPTIONS"; fieldId: string; options: FieldOption[] }
  | { type: "ADD_CONDITION"; condition: Condition }
  | { type: "UPDATE_CONDITION"; conditionId: string; patch: Partial<Condition> }
  | { type: "DELETE_CONDITION"; conditionId: string }
  | { type: "MARK_SAVED" }
  | { type: "HYDRATE"; fields: FormField[]; conditions: Condition[] };

function reducer(state: BuilderState, action: Action): BuilderState {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, fields: action.fields, conditions: action.conditions, dirty: false };

    case "ADD_FIELD": {
      const newField: FormField = {
        id: generateId("field"),
        form_version_id: "",
        type: action.fieldType,
        label: FIELD_TYPE_LABELS_AR[action.fieldType],
        description: "",
        placeholder: "",
        is_required: false,
        order_index: state.fields.length,
        options: ["radio", "checkbox", "select"].includes(action.fieldType)
          ? [
              { id: generateId("opt"), field_id: "", label: "خيار 1", value: "خيار 1", order_index: 0 },
              { id: generateId("opt"), field_id: "", label: "خيار 2", value: "خيار 2", order_index: 1 },
            ]
          : [],
      };
      const fields = [...state.fields, newField];
      return { ...state, fields, selectedFieldId: newField.id, dirty: true };
    }

    case "UPDATE_FIELD":
      return {
        ...state,
        fields: state.fields.map((f) => (f.id === action.fieldId ? { ...f, ...action.patch } : f)),
        dirty: true,
      };

    case "DELETE_FIELD":
      return {
        ...state,
        fields: state.fields
          .filter((f) => f.id !== action.fieldId)
          .map((f, i) => ({ ...f, order_index: i })),
        conditions: state.conditions.filter(
          (c) => c.source_field_id !== action.fieldId && c.target_field_id !== action.fieldId
        ),
        selectedFieldId: state.selectedFieldId === action.fieldId ? null : state.selectedFieldId,
        dirty: true,
      };

    case "DUPLICATE_FIELD": {
      const original = state.fields.find((f) => f.id === action.fieldId);
      if (!original) return state;
      const copy: FormField = {
        ...original,
        id: generateId("field"),
        label: `${original.label} (نسخة)`,
        options: (original.options ?? []).map((o) => ({ ...o, id: generateId("opt") })),
      };
      const index = state.fields.findIndex((f) => f.id === action.fieldId);
      const fields = [...state.fields];
      fields.splice(index + 1, 0, copy);
      return {
        ...state,
        fields: fields.map((f, i) => ({ ...f, order_index: i })),
        selectedFieldId: copy.id,
        dirty: true,
      };
    }

    case "REORDER_FIELDS":
      return {
        ...state,
        fields: action.fields.map((f, i) => ({ ...f, order_index: i })),
        dirty: true,
      };

    case "SELECT_FIELD":
      return { ...state, selectedFieldId: action.fieldId };

    case "SET_OPTIONS":
      return {
        ...state,
        fields: state.fields.map((f) => (f.id === action.fieldId ? { ...f, options: action.options } : f)),
        dirty: true,
      };

    case "ADD_CONDITION":
      return { ...state, conditions: [...state.conditions, action.condition], dirty: true };

    case "UPDATE_CONDITION":
      return {
        ...state,
        conditions: state.conditions.map((c) =>
          c.id === action.conditionId ? { ...c, ...action.patch } : c
        ),
        dirty: true,
      };

    case "DELETE_CONDITION":
      return {
        ...state,
        conditions: state.conditions.filter((c) => c.id !== action.conditionId),
        dirty: true,
      };

    case "MARK_SAVED":
      return { ...state, dirty: false };

    default:
      return state;
  }
}

export function useFormBuilderState(initial: { fields: FormField[]; conditions: Condition[] }) {
  const [state, dispatch] = useReducer(reducer, {
    fields: initial.fields,
    conditions: initial.conditions,
    selectedFieldId: null,
    dirty: false,
  });

  return { state, dispatch };
}
