import { Input } from "@/components/ui/input";
import type { FormField } from "@/types/form";

export function EmailField({
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
      type="email"
      dir="ltr"
      inputMode="email"
      value={value ?? ""}
      placeholder={field.placeholder || "example@domain.com"}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
