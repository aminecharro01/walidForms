// أنواع البيانات الخاصة بالنماذج / Form domain types

export type FieldType =
  | "short_text"
  | "long_text"
  | "number"
  | "email"
  | "date"
  | "time"
  | "radio"
  | "checkbox"
  | "select"
  | "location"
  | "file";

export const FIELD_TYPE_LABELS_AR: Record<FieldType, string> = {
  short_text: "نص قصير",
  long_text: "نص طويل",
  number: "رقم",
  email: "بريد إلكتروني",
  date: "تاريخ",
  time: "وقت",
  radio: "اختيار واحد",
  checkbox: "اختيار متعدد",
  select: "قائمة منسدلة",
  location: "الموقع الجغرافي",
  file: "رفع ملف",
};

export const FIELD_TYPE_LABELS_FR: Record<FieldType, string> = {
  short_text: "Texte court",
  long_text: "Texte long",
  number: "Nombre",
  email: "E-mail",
  date: "Date",
  time: "Heure",
  radio: "Choix unique",
  checkbox: "Choix multiple",
  select: "Liste déroulante",
  location: "Localisation",
  file: "Fichier",
};

export function getFieldTypeLabels(locale: "ar" | "fr"): Record<FieldType, string> {
  return locale === "fr" ? FIELD_TYPE_LABELS_FR : FIELD_TYPE_LABELS_AR;
}

export type FormStatus = "draft" | "published" | "paused";

/** Langue du formulaire public : détermine le sens d'affichage (rtl/ltr) et les textes système fixes. */
export type FormLanguage = "ar" | "fr";

export interface FieldOption {
  id: string;
  field_id: string;
  label: string;
  value: string;
  order_index: number;
}

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface FormField {
  id: string;
  form_version_id: string;
  type: FieldType;
  label: string;
  description?: string | null;
  placeholder?: string | null;
  is_required: boolean;
  order_index: number;
  section_id?: string | null;
  validation?: FieldValidation | null;
  options?: FieldOption[];
}

export interface FormSection {
  id: string;
  form_version_id: string;
  title: string;
  description?: string | null;
  order_index: number;
}

export interface FormVersion {
  id: string;
  form_id: string;
  version_number: number;
  created_at: string;
  fields: FormField[];
  sections: FormSection[];
  conditions: import("./condition").Condition[];
}

export interface Form {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  status: FormStatus;
  language: FormLanguage;
  current_version_id: string | null;
  published_version_id: string | null;
  public_slug: string;
  created_at: string;
  updated_at: string;
}

export interface FormWithStats extends Form {
  submission_count: number;
}
