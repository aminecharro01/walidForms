import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-lg animate-fade-in space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-cairo)] text-2xl font-bold text-slate-900">
          الإعدادات
        </h1>
        <p className="mt-1 text-sm text-slate-500">إدارة معلومات حسابك</p>
      </div>

      <SettingsForm email={user!.email ?? ""} initialFullName={profile?.full_name ?? ""} />
    </div>
  );
}
