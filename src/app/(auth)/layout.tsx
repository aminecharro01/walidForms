import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-slate-50 px-4">
      <LanguageSwitcher className="fixed top-4 left-4 rtl:left-auto rtl:right-4" />
      <div className="w-full max-w-md animate-fade-in">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <ClipboardList className="h-5 w-5" />
          </div>
          <span className="font-[family-name:var(--font-cairo)] text-lg font-bold text-slate-900">
            WalidForms
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
