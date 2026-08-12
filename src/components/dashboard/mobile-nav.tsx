"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Settings, ClipboardPlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/dashboard/forms", label: "النماذج", icon: ClipboardList },
  { href: "/dashboard/forms/create", label: "جديد", icon: ClipboardPlus },
  { href: "/dashboard/settings", label: "الإعدادات", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
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
