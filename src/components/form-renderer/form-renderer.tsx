"use client";

import { useMemo, useState } from "react";
import type { FormField } from "@/types/form";
import type { Condition } from "@/types/condition";
import { computeVisibleFields } from "@/lib/conditions/engine";
import { FieldRenderer } from "./field-renderer";

export function FormRenderer({
  fields,
  conditions,
  answers,
  onAnswerChange,
  errors,
}: {
  fields: FormField[];
  conditions: Condition[];
  answers: Record<string, unknown>;
  onAnswerChange: (fieldId: string, value: unknown) => void;
  errors?: Record<string, string>;
}) {
  const visibleFieldIds = useMemo(
    () => computeVisibleFields(fields, conditions, answers),
    [fields, conditions, answers]
  );

  const sortedFields = useMemo(
    () => [...fields].sort((a, b) => a.order_index - b.order_index),
    [fields]
  );

  return (
    <div className="space-y-5">
      {sortedFields
        .filter((f) => visibleFieldIds.has(f.id))
        .map((field) => (
          <FieldRenderer
            key={field.id}
            field={field}
            value={answers[field.id]}
            onChange={(v) => onAnswerChange(field.id, v)}
            error={errors?.[field.id]}
          />
        ))}
    </div>
  );
}

export function useFormAnswers(initial: Record<string, unknown> = {}) {
  const [answers, setAnswers] = useState<Record<string, unknown>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function setAnswer(fieldId: string, value: unknown) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }

  function reset() {
    setAnswers(initial);
    setErrors({});
  }

  return { answers, setAnswer, errors, setErrors, reset };
}
