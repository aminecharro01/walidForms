export function formatAnswerValue(value: unknown, fieldType?: string): string {
  if (value === null || value === undefined) return "—";

  if (fieldType === "location" && typeof value === "object") {
    const loc = value as { latitude?: number; longitude?: number };
    if (loc.latitude !== undefined && loc.longitude !== undefined) {
      return `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
    }
  }

  if (fieldType === "file" && typeof value === "object") {
    const file = value as { name?: string };
    return file.name ?? "ملف مرفق";
  }

  if (Array.isArray(value)) return value.join("، ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function formatDateAr(dateString: string): string {
  return new Date(dateString).toLocaleDateString("ar-MA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
