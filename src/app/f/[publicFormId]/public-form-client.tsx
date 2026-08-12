"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Loader2, ClipboardList } from "lucide-react";
import { FormRenderer, useFormAnswers } from "@/components/form-renderer/form-renderer";
import { Button } from "@/components/ui/button";
import { buildFormSchema } from "@/lib/validation/field-schemas";
import type { FormField } from "@/types/form";
import type { Condition } from "@/types/condition";

export function PublicFormClient({
  publicSlug,
  title,
  description,
  fields,
  conditions,
}: {
  publicSlug: string;
  title: string;
  description?: string | null;
  fields: FormField[];
  conditions: Condition[];
}) {
  const { answers, setAnswer, errors, setErrors } = useFormAnswers();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const schema = buildFormSchema(fields);
    const result = schema.safeParse(answers);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const fieldId = String(issue.path[0]);
        if (!fieldErrors[fieldId]) fieldErrors[fieldId] = issue.message;
      }
      setErrors(fieldErrors);
      const firstErrorField = document.getElementById(Object.keys(fieldErrors)[0]);
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    try {
      const fileFields = fields.filter((f) => f.type === "file");
      const hasFiles = fileFields.some((f) => answers[f.id] instanceof File);

      let res: Response;
      if (hasFiles) {
        const formData = new FormData();
        const answersForJson: Record<string, unknown> = { ...answers };
        for (const f of fileFields) {
          const file = answers[f.id];
          if (file instanceof File) {
            formData.append(`file:${f.id}`, file);
            delete answersForJson[f.id];
          }
        }
        formData.append("answers", JSON.stringify(answersForJson));
        res = await fetch(`/api/forms/${publicSlug}/submit`, { method: "POST", body: formData });
      } else {
        res = await fetch(`/api/forms/${publicSlug}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error || "حدث خطأ أثناء إرسال النموذج، الرجاء المحاولة مرة أخرى");
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError("تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-50 px-4 text-center animate-fade-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-5 font-[family-name:var(--font-cairo)] text-xl font-bold text-slate-900">
          تم إرسال إجابتك بنجاح
        </h1>
        <p className="mt-2 text-sm text-slate-500">شكراً لمشاركتك.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 px-4 py-8 sm:py-12">
      <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <ClipboardList className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-100 sm:p-8">
          <h1 className="font-[family-name:var(--font-cairo)] text-xl font-bold text-slate-900">
            {title}
          </h1>
          {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}

          <div className="mt-6 border-t border-slate-100 pt-6">
            <FormRenderer
              fields={fields}
              conditions={conditions}
              answers={answers}
              onAnswerChange={setAnswer}
              errors={errors}
            />
          </div>

          {submitError && (
            <div className="mt-5 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              {submitError}
            </div>
          )}

          <Button type="submit" className="mt-6 w-full" size="lg" loading={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> جارٍ الإرسال...
              </>
            ) : (
              "إرسال"
            )}
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">مدعوم بواسطة منصة النماذج</p>
      </form>
    </div>
  );
}
