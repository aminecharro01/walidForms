"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Loader2, ClipboardList, ClipboardPlus } from "lucide-react";
import { FormRenderer, useFormAnswers } from "@/components/form-renderer/form-renderer";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { LinkedinIcon } from "@/components/ui/linkedin-icon";
import { buildFormSchema } from "@/lib/validation/field-schemas";
import { translate, dirFor, type Locale } from "@/lib/i18n/dictionaries";
import type { FormField } from "@/types/form";
import type { Condition } from "@/types/condition";

export function PublicFormClient({
  publicSlug,
  title,
  description,
  language,
  headerImageUrl,
  fields,
  conditions,
}: {
  publicSlug: string;
  title: string;
  description?: string | null;
  language: Locale;
  headerImageUrl?: string | null;
  fields: FormField[];
  conditions: Condition[];
}) {
  const t = (key: Parameters<typeof translate>[1]) => translate(language, key);
  const dir = dirFor(language);
  const { answers, setAnswer, errors, setErrors } = useFormAnswers();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showRateLimitWarning, setShowRateLimitWarning] = useState(false);
  const [showFailureModal, setShowFailureModal] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const schema = buildFormSchema(fields, language);
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

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSubmitError(data.error || t("public.genericError"));
        setShowFailureModal(true);
        setSubmitting(false);
        return;
      }

      if (data.rateLimitWarning) setShowRateLimitWarning(true);
      setSubmitted(true);
      setSubmitting(false);
    } catch {
      setSubmitError(t("public.connectionError"));
      setShowFailureModal(true);
      setSubmitting(false);
    }
  }

  function handleFillAnother() {
    // Rechargement complet plutôt qu'une simple réinitialisation d'état : garantit un
    // état totalement neuf, sans aucun résidu de la soumission précédente.
    window.location.reload();
  }

  if (submitted) {
    return (
      <div
        dir={dir}
        className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-50 px-4 text-center animate-fade-in"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="mt-5 font-[family-name:var(--font-cairo)] text-xl font-bold text-slate-900">
          {t("public.submitSuccess")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{t("public.submitThanks")}</p>
        <Button variant="outline" className="mt-6" onClick={handleFillAnother}>
          <ClipboardPlus className="h-4 w-4" /> {t("public.fillAnother")}
        </Button>

        <Modal
          open={showRateLimitWarning}
          onClose={() => setShowRateLimitWarning(false)}
          title={t("public.rateLimitWarningTitle")}
          size="sm"
        >
          <div dir={dir} className="space-y-4 text-right">
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              {t("public.rateLimitWarningDesc")}
            </div>
            <Button className="w-full" onClick={() => setShowRateLimitWarning(false)}>
              {t("common.understood")}
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div dir={dir} className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 px-4 py-8 sm:py-12">
      <form onSubmit={handleSubmit} className="mx-auto max-w-xl">
        {headerImageUrl ? (
          <div
            className="mb-6 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-sm shadow-slate-100"
            style={{ aspectRatio: "1600 / 400" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={headerImageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white">
              <ClipboardList className="h-6 w-6" />
            </div>
          </div>
        )}

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
                <Loader2 className="h-4 w-4 animate-spin" /> {t("public.submitting")}
              </>
            ) : (
              t("public.submit")
            )}
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          {t("public.poweredBy")} WalidForms — {t("public.by")}{" "}
          <a
            href="https://www.linkedin.com/in/charroamine/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
          >
            <LinkedinIcon className="h-3.5 w-3.5" />
            Amine Charro
          </a>
        </p>
      </form>

      <Modal open={showFailureModal} onClose={() => setShowFailureModal(false)} title={t("public.submitFailedTitle")} size="sm">
        <div dir={dir} className="space-y-4 text-right">
          <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            {submitError}
          </div>
          <Button className="w-full" onClick={() => setShowFailureModal(false)}>
            {t("public.retry")}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
