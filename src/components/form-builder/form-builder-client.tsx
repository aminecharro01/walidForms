"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, GitBranch, Languages, Layers, MessageSquare, Settings2, Share2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useFormBuilderState } from "@/hooks/useFormBuilderState";
import { useAutosave } from "@/hooks/useAutosave";
import { FieldPalette } from "./field-palette";
import { BuilderCanvas } from "./builder-canvas";
import { PropertiesPanel } from "./properties-panel";
import { ConditionBuilder } from "./condition-builder";
import { PreviewModal } from "./preview-modal";
import { HeaderImageUploader } from "./header-image-uploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { saveFormMetaAction, saveVersionContentAction } from "@/app/(dashboard)/dashboard/forms/[id]/edit/actions";
import { updateFormStatusAction } from "@/app/(dashboard)/dashboard/forms/actions";
import type { Form, FormField, FieldType, FormLanguage } from "@/types/form";
import { getFieldTypeLabels } from "@/types/form";
import type { Condition } from "@/types/condition";
import { useLocale } from "@/lib/i18n/locale-context";

type Tab = "fields" | "conditions";

export function FormBuilderClient({
  form,
  initialFields,
  initialConditions,
}: {
  form: Form;
  initialFields: FormField[];
  initialConditions: Condition[];
}) {
  const { t } = useLocale();
  const { state, dispatch } = useFormBuilderState({ fields: initialFields, conditions: initialConditions });
  const [tab, setTab] = useState<Tab>("fields");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [mobilePropertiesOpen, setMobilePropertiesOpen] = useState(false);
  const [title, setTitle] = useState(form.title);
  const [description, setDescription] = useState(form.description ?? "");
  const [formLanguage, setFormLanguage] = useState<FormLanguage>(form.language ?? "ar");
  const [headerImageUrl, setHeaderImageUrl] = useState<string | null>(form.header_image_url ?? null);
  const [metaDirty, setMetaDirty] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const selectedField = state.fields.find((f) => f.id === state.selectedFieldId) ?? null;

  const saveStatus = useAutosave(state.dirty || metaDirty, async () => {
    await saveFormMetaAction(form.id, title, description, formLanguage, headerImageUrl);
    if (form.current_version_id) {
      await saveVersionContentAction(form.current_version_id, state.fields, state.conditions);
    }
    dispatch({ type: "MARK_SAVED" });
    setMetaDirty(false);
  });

  async function handlePublish() {
    setPublishing(true);
    await saveFormMetaAction(form.id, title, description, formLanguage, headerImageUrl);
    if (form.current_version_id) {
      await saveVersionContentAction(form.current_version_id, state.fields, state.conditions);
    }
    await updateFormStatusAction(form.id, "published");
    setPublishing(false);
  }

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col">
      {/* شريط الأدوات */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
        <Link href="/dashboard/forms">
          <Button variant="ghost" size="icon">
            <ArrowRight className="h-4.5 w-4.5" />
          </Button>
        </Link>

        <div className="flex min-w-0 flex-col">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setMetaDirty(true);
            }}
            className="h-9 max-w-xs border-none px-2 font-[family-name:var(--font-cairo)] text-base font-semibold focus:bg-slate-50"
          />
          <input
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setMetaDirty(true);
            }}
            placeholder={t("builder.descriptionPlaceholder")}
            className="max-w-xs border-none bg-transparent px-2 text-xs text-slate-400 placeholder:text-slate-300 focus:bg-slate-50 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5" title={t("builder.formLanguageHint")}>
          <Languages className="h-4 w-4 text-slate-400" />
          <select
            value={formLanguage}
            onChange={(e) => {
              setFormLanguage(e.target.value as FormLanguage);
              setMetaDirty(true);
            }}
            aria-label={t("builder.formLanguage")}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 focus:border-brand-500 focus:outline-none"
          >
            <option value="ar">{t("common.arabic")}</option>
            <option value="fr">{t("common.french")}</option>
          </select>
        </div>

        <SaveIndicator status={saveStatus} />

        <div className="mr-auto flex items-center gap-2">
          <Link href={`/dashboard/forms/${form.id}/responses`}>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4" /> {t("builder.responses")}
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setPreviewOpen(true)}>
            <Eye className="h-4 w-4" /> {t("builder.preview")}
          </Button>
          {form.status === "published" && (
            <Link href={`/dashboard/forms/${form.id}/share`}>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" /> {t("builder.share")}
              </Button>
            </Link>
          )}
          <Button size="sm" onClick={handlePublish} loading={publishing}>
            {form.status === "published" ? t("builder.republish") : t("builder.publish")}
          </Button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[220px_1fr_320px]">
        {/* لوحة أنواع الحقول */}
        <div className="hidden overflow-y-auto border-l border-slate-200 bg-white p-4 lg:block">
          <FieldPalette onAdd={(type) => dispatch({ type: "ADD_FIELD", fieldType: type })} />
        </div>

        {/* منطقة البناء */}
        <div className="overflow-y-auto bg-slate-50 p-4 lg:p-6">
          <div className="mx-auto max-w-2xl">
            {tab === "fields" && (
              <div className="mb-4">
                <HeaderImageUploader
                  formId={form.id}
                  value={headerImageUrl}
                  onChange={(url) => {
                    setHeaderImageUrl(url);
                    setMetaDirty(true);
                  }}
                />
              </div>
            )}
            <div className="mb-4 flex gap-1 rounded-xl bg-white p-1 shadow-sm w-fit">
              <TabButton active={tab === "fields"} onClick={() => setTab("fields")} icon={Layers}>
                {t("builder.fields")} ({state.fields.length})
              </TabButton>
              <TabButton active={tab === "conditions"} onClick={() => setTab("conditions")} icon={GitBranch}>
                {t("builder.conditions")} {state.conditions.length > 0 && `(${state.conditions.length})`}
              </TabButton>
            </div>

            {tab === "fields" ? (
              <>
                {/* لوحة أنواع الحقول للجوال */}
                <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
                  <FieldPaletteMobile onAdd={(type) => dispatch({ type: "ADD_FIELD", fieldType: type })} />
                </div>
                <BuilderCanvas
                  fields={state.fields}
                  selectedFieldId={state.selectedFieldId}
                  onSelect={(id) => {
                    dispatch({ type: "SELECT_FIELD", fieldId: id });
                    setMobilePropertiesOpen(true);
                  }}
                  onReorder={(fields) => dispatch({ type: "REORDER_FIELDS", fields })}
                  onDuplicate={(id) => dispatch({ type: "DUPLICATE_FIELD", fieldId: id })}
                  onDelete={(id) => dispatch({ type: "DELETE_FIELD", fieldId: id })}
                />
                {selectedField && (
                  <button
                    type="button"
                    onClick={() => setMobilePropertiesOpen(true)}
                    className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-200 lg:hidden"
                  >
                    <Settings2 className="h-4 w-4" /> {t("builder.properties")} — {selectedField.label}
                  </button>
                )}
              </>
            ) : (
              <ConditionBuilder
                fields={state.fields}
                conditions={state.conditions}
                onAdd={(c) => dispatch({ type: "ADD_CONDITION", condition: c })}
                onUpdate={(id, patch) => dispatch({ type: "UPDATE_CONDITION", conditionId: id, patch })}
                onDelete={(id) => dispatch({ type: "DELETE_CONDITION", conditionId: id })}
              />
            )}
          </div>
        </div>

        {/* لوحة الخصائص */}
        <div className="hidden overflow-y-auto border-r border-slate-200 bg-white p-4 lg:block">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500">
            <Settings2 className="h-4 w-4" /> {t("builder.properties")}
          </div>
          <PropertiesPanel
            field={selectedField}
            onChange={(patch) =>
              selectedField && dispatch({ type: "UPDATE_FIELD", fieldId: selectedField.id, patch })
            }
          />
        </div>
      </div>

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        description={description}
        fields={state.fields}
        conditions={state.conditions}
      />

      <Modal
        open={mobilePropertiesOpen && !!selectedField}
        onClose={() => setMobilePropertiesOpen(false)}
        title={t("builder.properties")}
        size="md"
      >
        <PropertiesPanel
          field={selectedField}
          onChange={(patch) =>
            selectedField && dispatch({ type: "UPDATE_FIELD", fieldId: selectedField.id, patch })
          }
        />
      </Modal>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Layers;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-100"
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  const { t } = useLocale();
  if (status === "saving") return <Badge tone="amber">{t("builder.saving")}</Badge>;
  if (status === "saved") return <Badge tone="green">{t("builder.savedStatus")}</Badge>;
  if (status === "error") return <Badge tone="red">{t("builder.saveFailed")}</Badge>;
  return <Badge tone="slate">{t("builder.unsaved")}</Badge>;
}

function FieldPaletteMobile({ onAdd }: { onAdd: (type: FieldType) => void }) {
  const { locale } = useLocale();
  const labels = getFieldTypeLabels(locale);
  const types: FieldType[] = [
    "short_text",
    "long_text",
    "number",
    "email",
    "date",
    "radio",
    "checkbox",
    "select",
    "location",
    "file",
  ];
  return (
    <>
      {types.map((type) => (
        <button
          key={type}
          onClick={() => onAdd(type)}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 whitespace-nowrap"
        >
          + {labels[type]}
        </button>
      ))}
    </>
  );
}
