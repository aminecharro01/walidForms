"use client";

import { useState } from "react";
import { CheckCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function SettingsForm({
  email,
  initialFullName,
}: {
  email: string;
  initialFullName: string;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <Label>البريد الإلكتروني</Label>
          <Input value={email} disabled dir="ltr" />
        </div>

        <div>
          <Label>الاسم الكامل</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} loading={saving}>
            حفظ التغييرات
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-600">
              <CheckCheck className="h-4 w-4" /> تم الحفظ
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
