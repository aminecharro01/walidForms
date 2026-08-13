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

  if (fieldType === "date" && typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return formatDateFr(value, { withTime: false });
  }

  if (Array.isArray(value)) return value.join("، ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Formate une date au format français jj-mm-aaaa [hh:mm]. */
export function formatDateFr(dateString: string, options: { withTime?: boolean } = {}): string {
  const { withTime = true } = options;
  const d = new Date(dateString);
  const datePart = `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
  if (!withTime) return datePart;
  return `${datePart} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
