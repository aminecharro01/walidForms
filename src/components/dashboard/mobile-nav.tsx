"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, MessageSquare, Settings, ClipboardPlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLocale } from "@/lib/i18n/locale-context";

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  const navItems = [
    { href: "/dashboard", label: t("nav.home"), icon: LayoutDashboard },
    { href: "/dashboard/forms", label: t("nav.forms"), icon: ClipboardList },
    { href: "/dashboard/responses", label: t("nav.responses"), icon: MessageSquare },
    { href: "/dashboard/forms/create", label: t("nav.new"), icon: ClipboardPlus },
    { href: "/dashboard/settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {navItems.map((item) => {
        const active =
          item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
              active ? "text-brand-600" : "text-slate-500"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
