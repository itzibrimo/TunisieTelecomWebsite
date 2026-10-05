export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  photoURL: string | null;
  role: "user" | "admin";
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  recoveryCodes?: string[];
  sessionExpiryDays?: 7 | 30 | 90;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface LoginHistoryEntry {
  id: string;
  timestamp: unknown;
  browser: string;
  os: string;
  ip: string;
  location: string;
  success: boolean;
  type: "login" | "failed_login" | "logout" | "password_change" | "email_change" | "2fa_enable" | "2fa_disable";
}

export interface Reclamation {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  subject: string;
  concernedNumber: string;
  message: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface NotificationEntry {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: unknown;
}

export interface Invoice {
  id: string;
  userId: string;
  amount: number;
  dueDate: unknown;
  issueDate: unknown;
  status: "pending" | "paid" | "overdue" | "cancelled";
  description: string;
  paidAmount?: number;
  paidDate?: unknown;
  createdAt: unknown;
  updatedAt?: unknown;
}

export interface ActivityEntry {
  id: string;
  type: "reclamation_created" | "reclamation_assigned" | "reclamation_updated" | "reclamation_resolved" | "invoice_created" | "invoice_paid" | "service_activated" | "offer_subscribed";
  title: string;
  description: string;
  timestamp: unknown;
  relatedId?: string; // ID of related entity (reclamation, invoice, etc.)
  metadata?: Record<string, unknown>;
}

export interface AdminStats {
  totalUsers: number;
  verifiedUsers: number;
  totalReclamations: number;
  openReclamations: number;
  resolvedReclamations: number;
  closedReclamations: number;
  inProgressReclamations: number;
  newReclamations: number;
  reclamationsByStatus: { name: string; value: number; color: string }[];
  reclamationsByMonth: { month: string; count: number }[];
  recentUsers: UserProfile[];
  recentReclamations: Reclamation[];
}
