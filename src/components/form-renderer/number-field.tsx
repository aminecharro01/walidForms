import { Input } from "@/components/ui/input";
import type { FormField } from "@/types/form";

export function NumberField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      value={value ?? ""}
      placeholder={field.placeholder ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
