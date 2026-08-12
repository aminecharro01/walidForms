"use client";

import { Modal } from "@/components/ui/modal";
import { FormRenderer, useFormAnswers } from "@/components/form-renderer/form-renderer";
import type { FormField } from "@/types/form";
import type { Condition } from "@/types/condition";

export function PreviewModal({
  open,
  onClose,
  title,
  description,
  fields,
  conditions,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string | null;
  fields: FormField[];
  conditions: Condition[];
}) {
  const { answers, setAnswer } = useFormAnswers();

  return (
    <Modal open={open} onClose={onClose} title="معاينة النموذج" size="lg">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6" dir="rtl">
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-[family-name:var(--font-cairo)] text-lg font-bold text-slate-900">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          <div className="mt-6">
            <FormRenderer
              fields={fields}
              conditions={conditions}
              answers={answers}
              onAnswerChange={setAnswer}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
