"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  MessageSquare,
  Settings,
  LogOut,
  ClipboardPlus,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/lib/i18n/locale-context";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export function Sidebar({ userEmail }: { userEmail?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLocale();

  const navItems = [
    { href: "/dashboard", label: t("nav.overview"), icon: LayoutDashboard },
    { href: "/dashboard/forms", label: t("nav.forms"), icon: ClipboardList },
    { href: "/dashboard/responses", label: t("nav.responses"), icon: MessageSquare },
    { href: "/dashboard/settings", label: t("nav.settings"), icon: Settings },
  ];

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-30 hidden w-64 flex-col border-l border-slate-200 bg-white lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <ClipboardList className="h-4.5 w-4.5" />
        </div>
        <span className="font-[family-name:var(--font-cairo)] text-base font-bold text-slate-900">
          WalidForms
        </span>
      </div>

      <div className="p-4">
        <Link href="/dashboard/forms/create">
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-indigo-200 transition-colors hover:bg-brand-700">
            <ClipboardPlus className="h-4 w-4" />
            {t("nav.newForm")}
          </button>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-100 p-4 space-y-3">
        <LanguageSwitcher className="w-full justify-center" />
        {userEmail && (
          <p className="truncate px-1 text-xs text-slate-400" dir="ltr">
            {userEmail}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4.5 w-4.5" />
          {t("nav.logout")}
        </button>
      </div>
    </aside>
  );
}
