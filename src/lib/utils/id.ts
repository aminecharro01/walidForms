export function generateId(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function generatePublicSlug(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}
