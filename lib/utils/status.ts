/**
 * Reclamation status configuration — single source of truth
 */

export const STATUS_CONFIG: Record<string, { label: string; variant: "brand" | "info" | "success" | "default" }> = {
  new: { label: "Nouvelle", variant: "brand" },
  in_progress: { label: "En cours", variant: "info" },
  resolved: { label: "Résolue", variant: "success" },
  closed: { label: "Fermée", variant: "default" },
};

export const INVOICE_STATUS_CONFIG: Record<string, { label: string; variant: "brand" | "info" | "success" | "default" }> = {
  pending: { label: "En attente", variant: "brand" },
  paid: { label: "Payée", variant: "success" },
  overdue: { label: "En retard", variant: "default" },
  cancelled: { label: "Annulée", variant: "default" },
};
