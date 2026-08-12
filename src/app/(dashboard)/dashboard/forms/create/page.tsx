"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createFormAction } from "../actions";

export default function CreateFormPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      await createFormAction(title);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg animate-fade-in">
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <ClipboardList className="h-7 w-7" />
        </div>
        <h1 className="mt-4 font-[family-name:var(--font-cairo)] text-xl font-bold text-slate-900">
          إنشاء نموذج جديد
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          ابدأ بإعطاء نموذجك عنواناً، يمكنك تعديله لاحقاً
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Label htmlFor="title">عنوان النموذج</Label>
          <Input
            id="title"
            placeholder="مثال: استبيان رضا العملاء"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <div className="mt-6 flex justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              إلغاء
            </Button>
            <Button onClick={handleCreate} loading={loading}>
              متابعة إلى المحرر
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
