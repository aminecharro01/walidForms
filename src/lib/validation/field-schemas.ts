import { z } from "zod";
import type { FormField } from "@/types/form";

const REQUIRED_MSG = "هذا الحقل مطلوب";
const EMAIL_MSG = "البريد الإلكتروني غير صالح";
const NUMBER_MSG = "الرجاء إدخال رقم صالح";

/** Construit un schéma Zod dynamique à partir de la définition d'un champ. */
export function buildFieldSchema(field: FormField): z.ZodTypeAny {
  let schema: z.ZodTypeAny;

  switch (field.type) {
    case "short_text":
    case "long_text": {
      let s = z.string();
      if (field.validation?.minLength) s = s.min(field.validation.minLength, REQUIRED_MSG);
      if (field.validation?.maxLength) s = s.max(field.validation.maxLength);
      schema = field.is_required ? s.min(1, REQUIRED_MSG) : s.optional().or(z.literal(""));
      break;
    }
    case "email": {
      const s = z.string().email(EMAIL_MSG);
      schema = field.is_required ? s : s.optional().or(z.literal(""));
      break;
    }
    case "number": {
      let s = z.coerce.number({ error: NUMBER_MSG });
      if (field.validation?.min !== undefined) s = s.min(field.validation.min);
      if (field.validation?.max !== undefined) s = s.max(field.validation.max);
      schema = field.is_required ? s : s.optional();
      break;
    }
    case "date":
    case "time": {
      const s = z.string().min(1, REQUIRED_MSG);
      schema = field.is_required ? s : s.optional().or(z.literal(""));
      break;
    }
    case "radio":
    case "select": {
      const s = z.string().min(1, REQUIRED_MSG);
      schema = field.is_required ? s : s.optional().or(z.literal(""));
      break;
    }
    case "checkbox": {
      const s = z.array(z.string());
      schema = field.is_required ? s.min(1, REQUIRED_MSG) : s.optional();
      break;
    }
    case "location": {
      const locationSchema = z.object({
        latitude: z.number(),
        longitude: z.number(),
        accuracy: z.number(),
        capturedAt: z.string(),
      });
      schema = field.is_required ? locationSchema : locationSchema.optional().nullable();
      break;
    }
    case "file": {
      schema = field.is_required
        ? z.any().refine((v) => v !== null && v !== undefined, REQUIRED_MSG)
        : z.any().optional().nullable();
      break;
    }
    default:
      schema = z.any();
  }

  return schema;
}

export function buildFormSchema(fields: FormField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    shape[field.id] = buildFieldSchema(field);
  }
  return z.object(shape);
}
