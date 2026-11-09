/** Shared month/day parsing for anniversary dates.
 * Storage holds a bare date (`YYYY-MM-DD`, from `dateToIso`) since v0.2.2,
 * but legacy rows may hold a full UTC ISO (`1990-05-13T22:00:00.000Z`)
 * or a bare `MM-DD`. Both shapes are accepted and normalized to the local
 * calendar date so readers never have to guess the stored shape.
 * Invalid dates → null.
 */

function normalizeDateInput(date: string): string {
  const trimmed = String(date ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const isoPrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoPrefix) return isoPrefix[1];
  const barePrefix = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  if (barePrefix && !trimmed.includes("T")) return barePrefix[1];
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) {
    const m = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : trimmed;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function isValidDate(
  year: number,
  month: number,
  day: number,
): boolean {
  const d = new Date(year, month - 1, day);
  return (
    d.getFullYear() === year &&
    d.getMonth() === month - 1 &&
    d.getDate() === day
  );
}

export function parseMonthDay(
  date: string,
): { month: number; day: number } | null {
  const normalized = normalizeDateInput(date);
  const iso = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31)
      return { month, day };
    return null;
  }
  const bare = normalized.match(/^(\d{1,2})-(\d{1,2})$/);
  if (bare) {
    const month = Number(bare[1]);
    const day = Number(bare[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31)
      return { month, day };
  }
  return null;
}
