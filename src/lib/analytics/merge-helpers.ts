import type { FormField } from "@/types/form";

/** Retire les diacritiques arabes (tashkeel) et normalise les espaces, pour une
 * correspondance de libellés de champs robuste aux petites variations d'écriture
 * entre formulaires distincts (ex: plusieurs jours d'un même relevé de terrain). */
export function normalizeLabel(label: string): string {
  return label
    .normalize("NFKD")
    .replace(/[ً-ٰٟ]/g, "") // tashkeel
    .replace(/\s+/g, " ")
    .trim();
}

/** Trouve, parmi une liste de champs fusionnés, le premier dont le libellé contient
 * TOUS les mots-clés donnés (recherche insensible aux diacritiques). */
export function findFieldByKeywords(fields: FormField[], keywords: string[]): FormField | undefined {
  return fields.find((f) => {
    const label = normalizeLabel(f.label);
    return keywords.every((k) => label.includes(k));
  });
}

export type OccupancyStatus = "occupied" | "abandoned" | "seasonal" | "other";

/** Classe une valeur de statut d'occupation (texte libre choisi par l'admin dans un
 * champ radio/select) en 3 grandes catégories, par correspondance de mots-clés. */
export function classifyOccupancy(value: unknown): OccupancyStatus {
  if (typeof value !== "string") return "other";
  const v = normalizeLabel(value);
  if (v.includes("مهجور")) return "abandoned";
  if (v.includes("موسمي") || v.includes("مؤقت")) return "seasonal";
  if (v.includes("مسكون")) return "occupied";
  return "other";
}

export const OCCUPANCY_LABELS_AR: Record<OccupancyStatus, string> = {
  occupied: "مسكون بشكل دائم",
  abandoned: "مهجور بشكل دائم",
  seasonal: "مسكون بشكل مؤقت/موسمي",
  other: "غير محدد",
};

export const OCCUPANCY_COLORS: Record<OccupancyStatus, string> = {
  occupied: "#10b981",
  abandoned: "#ef4444",
  seasonal: "#f59e0b",
  other: "#94a3b8",
};
