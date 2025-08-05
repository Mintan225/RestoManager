// Système de permissions pour la gestion des utilisateurs

export type Permission = 
  // Gestion des produits
  | "products.view" 
  | "products.create" 
  | "products.edit" 
  | "products.delete"
  | "products.archive"
  
  // Gestion des catégories
  | "categories.view"
  | "categories.create"
  | "categories.edit"
  | "categories.delete"
  
  // Gestion des commandes
  | "orders.view"
  | "orders.create"
  | "orders.edit"
  | "orders.delete"
  | "orders.update_status"
  
  // Gestion des ventes
  | "sales.view"
  | "sales.create"
  | "sales.delete"
  | "sales.export"
  
  // Gestion des dépenses
  | "expenses.view"
  | "expenses.create"
  | "expenses.edit"
  | "expenses.delete"
  
  // Gestion des tables
  | "tables.view"
  | "tables.create"
  | "tables.edit"
  | "tables.delete"
  | "tables.generate_qr"
  
  // Analytics et rapports
  | "analytics.view"
  | "analytics.export"
  
  // Gestion des utilisateurs (admin/manager seulement)
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  | "users.manage_permissions"
  
  // Configuration système
  | "config.view"
  | "config.edit"
  | "config.payment_methods"
  
  // Archives
  | "archives.view"
  | "archives.restore";

export type UserRole = "admin" | "manager" | "employee" | "cashier";

// Permissions par défaut pour chaque rôle
export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Accès complet à tout
    "products.view", "products.create", "products.edit", "products.delete", "products.archive",
    "categories.view", "categories.create", "categories.edit", "categories.delete",
    "orders.view", "orders.create", "orders.edit", "orders.delete", "orders.update_status",
    "sales.view", "sales.create", "sales.delete", "sales.export",
    "expenses.view", "expenses.create", "expenses.edit", "expenses.delete",
    "tables.view", "tables.create", "tables.edit", "tables.delete", "tables.generate_qr",
    "analytics.view", "analytics.export",
    "users.view", "users.create", "users.edit", "users.delete", "users.manage_permissions",
    "config.view", "config.edit", "config.payment_methods",
    "archives.view", "archives.restore"
  ],
  
  manager: [
    // Gestion opérationnelle complète sauf gestion des utilisateurs admin
    "products.view", "products.create", "products.edit", "products.delete", "products.archive",
    "categories.view", "categories.create", "categories.edit", "categories.delete",
    "orders.view", "orders.create", "orders.edit", "orders.update_status",
    "sales.view", "sales.create", "sales.delete", "sales.export",
    "expenses.view", "expenses.create", "expenses.edit", "expenses.delete",
    "tables.view", "tables.create", "tables.edit", "tables.generate_qr",
    "analytics.view", "analytics.export",
    "users.view", "users.create", "users.edit",
    "config.view", "config.edit",
    "archives.view", "archives.restore"
  ],
  
  employee: [
    // Opérations de base
    "products.view",
    "categories.view",
    "orders.view", "orders.create", "orders.update_status",
    "sales.view", "sales.create",
    "expenses.view", "expenses.create",
    "tables.view",
    "analytics.view"
  ],
  
  cashier: [
    // Gestion des ventes et commandes
    "products.view",
    "categories.view",
    "orders.view", "orders.update_status",
    "sales.view", "sales.create", "sales.export",
    "tables.view",
    "analytics.view"
  ]
};

export function hasPermission(userPermissions: string[], requiredPermission: Permission): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAnyPermission(userPermissions: string[], requiredPermissions: Permission[]): boolean {
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case "admin": return "Administrateur";
    case "manager": return "Manager";
    case "employee": return "Employé";
    case "cashier": return "Caissier";
    default: return "Inconnu";
  }
}

export function getPermissionDisplayName(permission: Permission): string {
  const permissions: Record<Permission, string> = {
    "products.view": "Voir les produits",
    "products.create": "Créer des produits",
    "products.edit": "Modifier les produits",
    "products.delete": "Supprimer les produits",
    "products.archive": "Archiver les produits",
    
    "categories.view": "Voir les catégories",
    "categories.create": "Créer des catégories",
    "categories.edit": "Modifier les catégories",
    "categories.delete": "Supprimer les catégories",
    
    "orders.view": "Voir les commandes",
    "orders.create": "Créer des commandes",
    "orders.edit": "Modifier les commandes",
    "orders.delete": "Supprimer les commandes",
    "orders.update_status": "Changer le statut des commandes",
    
    "sales.view": "Voir les ventes",
    "sales.create": "Enregistrer des ventes",
    "sales.delete": "Supprimer des ventes",
    "sales.export": "Exporter les ventes",
    
    "expenses.view": "Voir les dépenses",
    "expenses.create": "Enregistrer des dépenses",
    "expenses.edit": "Modifier les dépenses",
    "expenses.delete": "Supprimer les dépenses",
    
    "tables.view": "Voir les tables",
    "tables.create": "Créer des tables",
    "tables.edit": "Modifier les tables",
    "tables.delete": "Supprimer des tables",
    "tables.generate_qr": "Générer des QR codes",
    
    "analytics.view": "Voir les statistiques",
    "analytics.export": "Exporter les rapports",
    
    "users.view": "Voir les utilisateurs",
    "users.create": "Créer des utilisateurs",
    "users.edit": "Modifier les utilisateurs",
    "users.delete": "Supprimer des utilisateurs",
    "users.manage_permissions": "Gérer les permissions",
    
    "config.view": "Voir la configuration",
    "config.edit": "Modifier la configuration",
    "config.payment_methods": "Configurer les paiements",
    
    "archives.view": "Voir les archives",
    "archives.restore": "Restaurer des éléments"
  };
  
  return permissions[permission] || permission;
}