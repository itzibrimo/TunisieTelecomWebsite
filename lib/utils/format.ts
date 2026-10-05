/**
 * Shared formatting utilities — single source of truth
 */

export function fmtDate(d: unknown): string {
  if (!d) return "—";
  const date = (d as { toDate?: () => Date })?.toDate?.() ?? new Date(d as string | number);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `Il y a ${h}h`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function fmtDateFull(d: unknown): string {
  if (!d) return "—";
  const date = (d as { toDate?: () => Date })?.toDate?.() ?? new Date(d as string | number);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateRelative(d: unknown): string {
  if (!d) return "—";
  const date = (d as { toDate?: () => Date })?.toDate?.() ?? new Date(d as string | number);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `Il y a ${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export function fmtCurrency(amount: number, currency = "TND"): string {
  return `${amount.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}
