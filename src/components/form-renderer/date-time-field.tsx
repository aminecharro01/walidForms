import { Input } from "@/components/ui/input";
import type { FormField } from "@/types/form";

export function DateTimeField({
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
      type={field.type === "date" ? "date" : "time"}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-xs"
    />
  );
}
