/**
 * Date utility functions — all run in the browser's local timezone.
 */

export function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isToday(raw: string | null | undefined): boolean {
  const d = parseDate(raw);
  if (!d) return false;
  const now = startOfDay(new Date());
  const day = startOfDay(d);
  return now.getTime() === day.getTime();
}

export function isTomorrow(raw: string | null | undefined): boolean {
  const d = parseDate(raw);
  if (!d) return false;
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  return startOfDay(d).getTime() === tomorrow.getTime();
}

export function isPast(raw: string | null | undefined): boolean {
  const d = parseDate(raw);
  if (!d) return false;
  return d.getTime() < Date.now();
}

export function isFuture(raw: string | null | undefined): boolean {
  const d = parseDate(raw);
  if (!d) return false;
  return d.getTime() > Date.now();
}

export function formatFriendlyDate(raw: string | null | undefined): string {
  const d = parseDate(raw);
  if (!d) return "";
  if (isToday(raw))    return `Today at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (isTomorrow(raw)) return `Tomorrow at ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined });
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatDisplayDate(): string {
  return new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
