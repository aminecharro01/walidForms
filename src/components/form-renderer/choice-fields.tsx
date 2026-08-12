import type { FormField } from "@/types/form";
import { cn } from "@/lib/utils/cn";

export function RadioField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      {(field.options ?? []).map((option) => (
        <label
          key={option.id}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
            value === option.value ? "border-brand-400 bg-brand-50" : "border-slate-200 hover:bg-slate-50"
          )}
        >
          <input
            type="radio"
            name={field.id}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="h-4.5 w-4.5 shrink-0 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-slate-800">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export function CheckboxField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const selected = value ?? [];

  function toggle(optValue: string) {
    if (selected.includes(optValue)) {
      onChange(selected.filter((v) => v !== optValue));
    } else {
      onChange([...selected, optValue]);
    }
  }

  return (
    <div className="space-y-2">
      {(field.options ?? []).map((option) => (
        <label
          key={option.id}
          className={cn(
            "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
            selected.includes(option.value)
              ? "border-brand-400 bg-brand-50"
              : "border-slate-200 hover:bg-slate-50"
          )}
        >
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={() => toggle(option.value)}
            className="h-4.5 w-4.5 shrink-0 rounded text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-slate-800">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export function SelectField({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
    >
      <option value="">اختر...</option>
      {(field.options ?? []).map((option) => (
        <option key={option.id} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
