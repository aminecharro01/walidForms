import { Input, Textarea } from "@/components/ui/input";
import type { FormField } from "@/types/form";

export function TextField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) {
  if (field.type === "long_text") {
    return (
      <Textarea
        rows={4}
        value={value ?? ""}
        placeholder={field.placeholder ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <Input
      type="text"
      value={value ?? ""}
      placeholder={field.placeholder ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
