export function normalizeHosts(input: unknown): string[] {
  if (!input) return [];

  if (Array.isArray(input)) {
    return input
      .flatMap(normalizeHosts)
      .map((h) => h.trim())
      .filter(Boolean);
  }

  if (typeof input !== 'string') return [];

  return input
    .split(/[\n,]/g)
    .map((h) => h.trim())
    .filter(Boolean);
}
