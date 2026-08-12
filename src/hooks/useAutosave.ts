"use client";

import { useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Déclenche `onSave` après `delay` ms d'inactivité suivant un changement de `dirty`.
 * Retourne le statut courant pour affichage ("محفوظ" / "جارٍ الحفظ" / "غير محفوظ").
 */
export function useAutosave(dirty: boolean, onSave: () => Promise<void>, delay = 2000) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!dirty) return;

    const idleTimer = setTimeout(() => setStatus("idle"), 0);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await onSave();
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    }, delay);

    return () => {
      clearTimeout(idleTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, delay]);

  return status;
}
