/**
 * =============================================================================
 * SYSTÈME RBAC (Role-Based Access Control)
 * =============================================================================
 *
 * Gestion des rôles et permissions de l'application
 *
 * Hiérarchie des rôles:
 * 1. customer      - Client standard
 * 2. support       - Agent de support
 * 3. moderator     - Modérateur
 * 4. admin         - Administrateur
 * 5. superadmin    - Super administrateur
 * =============================================================================
 */

export type UserRole = "customer" | "support" | "moderator" | "admin" | "superadmin";

export type Permission =
  | "view_own_reclamations"
  | "create_reclamation"
  | "manage_reclamations"
  | "assign_reclamations"
  | "view_all_users"
  | "manage_users"
  | "change_roles"
  | "view_audit_logs"
  | "view_analytics"
  | "manage_settings"
  | "delete_users";

// =============================================================================
// Matrice des permissions par rôle
// =============================================================================

const rolePermissions: Record<UserRole, Permission[]> = {
  customer: [
    "view_own_reclamations",
    "create_reclamation",
  ],
  support: [
    "view_own_reclamations",
    "create_reclamation",
    "manage_reclamations",
  ],
  moderator: [
    "view_own_reclamations",
    "create_reclamation",
    "manage_reclamations",
    "assign_reclamations",
    "view_all_users",
    "view_analytics",
  ],
  admin: [
    "view_own_reclamations",
    "create_reclamation",
    "manage_reclamations",
    "assign_reclamations",
    "view_all_users",
    "manage_users",
    "view_audit_logs",
    "view_analytics",
    "manage_settings",
  ],
  superadmin: [
    "view_own_reclamations",
    "create_reclamation",
    "manage_reclamations",
    "assign_reclamations",
    "view_all_users",
    "manage_users",
    "change_roles",
    "view_audit_logs",
    "view_analytics",
    "manage_settings",
    "delete_users",
  ],
};

// =============================================================================
// Vérifier si un rôle a une permission spécifique
// =============================================================================

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  return permissions.includes(permission);
}

// =============================================================================
// Vérifier si un rôle est au moins au niveau spécifié
// =============================================================================

const roleHierarchy: Record<UserRole, number> = {
  customer: 1,
  support: 2,
  moderator: 3,
  admin: 4,
  superadmin: 5,
};

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[minimumRole];
}

// =============================================================================
// Obtenir toutes les permissions d'un rôle
// =============================================================================

export function getPermissions(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}

// =============================================================================
// Vérifier si un rôle est un rôle administrateur
// =============================================================================

export function isAdmin(role: UserRole): boolean {
  return ["admin", "superadmin"].includes(role);
}

// =============================================================================
// Vérifier si un rôle est un rôle de support
// =============================================================================

export function isSupport(role: UserRole): boolean {
  return ["support", "moderator", "admin", "superadmin"].includes(role);
}

// =============================================================================
// Obtenir le niveau de rôle (pour comparaisons)
// =============================================================================

export function getRoleLevel(role: UserRole): number {
  return roleHierarchy[role] || 0;
}
