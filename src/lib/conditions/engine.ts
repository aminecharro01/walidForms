import type { Condition, ConditionOperator } from "@/types/condition";
import type { FormField } from "@/types/form";

export type AnswersMap = Record<string, unknown>;

/**
 * محرك المنطق الشرطي — وحدة مستقلة بدون أي اعتماد على واجهة المستخدم.
 * ConditionEngine — pure module, no React/UI dependency, testable in isolation.
 * Runs both client-side (live UX) and server-side (submission validation).
 */

function toComparable(value: unknown): string | number | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.join(",");
  if (typeof value === "object") return JSON.stringify(value);
  return value as string | number;
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function evaluateOperator(
  operator: ConditionOperator,
  answerValue: unknown,
  targetValue: string | number | null
): boolean {
  switch (operator) {
    case "is_empty":
      return isEmptyValue(answerValue);
    case "is_not_empty":
      return !isEmptyValue(answerValue);
    case "equals":
      return String(toComparable(answerValue)) === String(targetValue);
    case "not_equals":
      return String(toComparable(answerValue)) !== String(targetValue);
    case "contains": {
      if (Array.isArray(answerValue)) {
        return answerValue.map(String).includes(String(targetValue));
      }
      return String(toComparable(answerValue) ?? "").includes(String(targetValue ?? ""));
    }
    case "greater_than": {
      const a = Number(answerValue);
      const b = Number(targetValue);
      return !Number.isNaN(a) && !Number.isNaN(b) && a > b;
    }
    case "less_than": {
      const a = Number(answerValue);
      const b = Number(targetValue);
      return !Number.isNaN(a) && !Number.isNaN(b) && a < b;
    }
    case "greater_or_equal": {
      const a = Number(answerValue);
      const b = Number(targetValue);
      return !Number.isNaN(a) && !Number.isNaN(b) && a >= b;
    }
    case "less_or_equal": {
      const a = Number(answerValue);
      const b = Number(targetValue);
      return !Number.isNaN(a) && !Number.isNaN(b) && a <= b;
    }
    default:
      return false;
  }
}

/**
 * Calcule l'ensemble des champs visibles étant donné les réponses actuelles.
 * Règle : un champ ciblé par au moins une condition "hide" qui s'évalue à vrai
 * est caché. Un champ ciblé uniquement par des conditions "show" est caché par
 * défaut tant qu'aucune ne s'évalue à vrai. Un champ non ciblé par aucune
 * condition est toujours visible.
 */
export function computeVisibleFields(
  fields: FormField[],
  conditions: Condition[],
  currentAnswers: AnswersMap
): Set<string> {
  const visible = new Set<string>(fields.map((f) => f.id));

  const conditionsByTarget = new Map<string, Condition[]>();
  for (const condition of conditions) {
    const list = conditionsByTarget.get(condition.target_field_id) ?? [];
    list.push(condition);
    conditionsByTarget.set(condition.target_field_id, list);
  }

  for (const [targetFieldId, targetConditions] of conditionsByTarget) {
    const showConditions = targetConditions.filter((c) => c.action === "show");
    const hideConditions = targetConditions.filter((c) => c.action === "hide");

    let isVisible = true;

    if (showConditions.length > 0) {
      isVisible = showConditions.some((c) =>
        evaluateOperator(c.operator, currentAnswers[c.source_field_id], c.value)
      );
    }

    if (isVisible && hideConditions.length > 0) {
      const shouldHide = hideConditions.some((c) =>
        evaluateOperator(c.operator, currentAnswers[c.source_field_id], c.value)
      );
      if (shouldHide) isVisible = false;
    }

    if (isVisible) {
      visible.add(targetFieldId);
    } else {
      visible.delete(targetFieldId);
    }
  }

  return visible;
}

/**
 * Nettoie les réponses pour ne garder que celles des champs actuellement
 * visibles — utilisé côté serveur pour ignorer toute réponse à un champ qui
 * aurait dû rester caché (défense en profondeur, ne jamais faire confiance
 * au client seul).
 */
export function sanitizeAnswersToVisibleFields(
  answers: AnswersMap,
  fields: FormField[],
  conditions: Condition[]
): AnswersMap {
  const visible = computeVisibleFields(fields, conditions, answers);
  const sanitized: AnswersMap = {};
  for (const fieldId of Object.keys(answers)) {
    if (visible.has(fieldId)) sanitized[fieldId] = answers[fieldId];
  }
  return sanitized;
}
