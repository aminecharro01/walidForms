"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, LogOut } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/locale-context";

export function SettingsForm({
  email,
  initialFullName,
}: {
  email: string;
  initialFullName: string;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [fullName, setFullName] = useState(initialFullName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 p-6">
          <div>
            <Label>{t("auth.email")}</Label>
            <Input value={email} disabled dir="ltr" />
          </div>

          <div>
            <Label>{t("auth.fullName")}</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} loading={saving}>
              {t("common.save")}
            </Button>
            {saved && (
              <span className="flex items-center gap-1 text-sm text-emerald-600">
                <CheckCheck className="h-4 w-4" /> {t("settings.saved")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-slate-900">{t("settings.languageTitle")}</p>
            <p className="mt-0.5 text-xs text-slate-500">{t("settings.languageDesc")}</p>
          </div>
          <LanguageSwitcher />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium text-slate-900">{t("settings.sessionTitle")}</p>
            <p className="mt-0.5 text-xs text-slate-500">{t("settings.sessionDesc")}</p>
          </div>
          <Button variant="danger" onClick={handleLogout} loading={loggingOut}>
            <LogOut className="h-4 w-4" /> {t("nav.logout")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
