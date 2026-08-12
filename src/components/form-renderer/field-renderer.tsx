"use client";

import type { FormField } from "@/types/form";
import { TextField } from "./text-field";
import { NumberField } from "./number-field";
import { EmailField } from "./email-field";
import { DateTimeField } from "./date-time-field";
import { RadioField, CheckboxField, SelectField } from "./choice-fields";
import { LocationField } from "./location-field";
import { FileField } from "./file-field";
import { Label, FieldError } from "@/components/ui/input";

export function FieldRenderer({
  field,
  value,
  onChange,
  error,
}: {
  field: FormField;
  value: unknown;
  onChange: (v: unknown) => void;
  error?: string;
}) {
  return (
    <div className="animate-fade-in">
      <Label htmlFor={field.id}>
        {field.label}
        {field.is_required && <span className="mr-1 text-red-500">*</span>}
      </Label>
      {field.description && <p className="mb-2 -mt-1 text-xs text-slate-500">{field.description}</p>}

      {renderControl()}

      <FieldError>{error}</FieldError>
    </div>
  );

  function renderControl() {
    switch (field.type) {
      case "short_text":
      case "long_text":
        return <TextField field={field} value={(value as string) ?? ""} onChange={onChange} />;
      case "number":
        return <NumberField field={field} value={(value as string) ?? ""} onChange={onChange} />;
      case "email":
        return <EmailField field={field} value={(value as string) ?? ""} onChange={onChange} />;
      case "date":
      case "time":
        return <DateTimeField field={field} value={(value as string) ?? ""} onChange={onChange} />;
      case "radio":
        return <RadioField field={field} value={(value as string) ?? ""} onChange={onChange} />;
      case "checkbox":
        return <CheckboxField field={field} value={(value as string[]) ?? []} onChange={onChange} />;
      case "select":
        return <SelectField field={field} value={(value as string) ?? ""} onChange={onChange} />;
      case "location":
        return (
          <LocationField
            value={(value as import("@/types/submission").LocationAnswer) ?? null}
            onChange={onChange}
          />
        );
      case "file":
        return <FileField value={(value as File) ?? null} onChange={onChange} />;
      default:
        return null;
    }
  }
}
