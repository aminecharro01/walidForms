import { z } from "zod";
import type { FormField } from "@/types/form";
import { translate, type Locale } from "@/lib/i18n/dictionaries";

/** Construit un schéma Zod dynamique à partir de la définition d'un champ, dans la langue du formulaire. */
export function buildFieldSchema(field: FormField, locale: Locale = "ar"): z.ZodTypeAny {
  const REQUIRED_MSG = translate(locale, "public.requiredField");
  const EMAIL_MSG = translate(locale, "public.invalidEmail");
  const NUMBER_MSG = translate(locale, "public.invalidNumber");

  let schema: z.ZodTypeAny;

  switch (field.type) {
    case "short_text":
    case "long_text": {
      let s = z.string({ error: REQUIRED_MSG });
      if (field.validation?.minLength) s = s.min(field.validation.minLength, REQUIRED_MSG);
      if (field.validation?.maxLength) s = s.max(field.validation.maxLength);
      schema = field.is_required ? s.min(1, REQUIRED_MSG) : s.optional().or(z.literal(""));
      break;
    }
    case "email": {
      const s = z.string({ error: REQUIRED_MSG }).email(EMAIL_MSG);
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
      const s = z.string({ error: REQUIRED_MSG }).min(1, REQUIRED_MSG);
      schema = field.is_required ? s : s.optional().or(z.literal(""));
      break;
    }
    case "radio":
    case "select": {
      const s = z.string({ error: REQUIRED_MSG }).min(1, REQUIRED_MSG);
      schema = field.is_required ? s : s.optional().or(z.literal(""));
      break;
    }
    case "checkbox": {
      const s = z.array(z.string(), { error: REQUIRED_MSG });
      schema = field.is_required ? s.min(1, REQUIRED_MSG) : s.optional();
      break;
    }
    case "location": {
      const locationSchema = z.object(
        {
          latitude: z.number(),
          longitude: z.number(),
          accuracy: z.number(),
          capturedAt: z.string(),
        },
        { error: REQUIRED_MSG }
      );
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

export function buildFormSchema(fields: FormField[], locale: Locale = "ar") {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of fields) {
    shape[field.id] = buildFieldSchema(field, locale);
  }
  return z.object(shape);
}
