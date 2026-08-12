"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export function Dropdown({
  trigger,
  children,
  align = "end",
}: {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          className={cn(
            "absolute z-40 mt-2 min-w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg animate-fade-in",
            align === "end" ? "left-0" : "right-0"
          )}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  className,
  danger,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-right text-sm transition-colors",
        danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-100",
        className
      )}
      {...props}
    />
  );
}
