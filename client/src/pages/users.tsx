import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
// COMMENTEZ CES IMPORTS DE DIALOG
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// COMMENTEZ CES IMPORTS D'ALERTDIALOG
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Settings,
} from "lucide-react";
import authService from "@/lib/auth";
import { DEFAULT_PERMISSIONS, getRoleDisplayName, getPermissionDisplayName, type UserRole, type Permission } from "@shared/permissions";

const userFormSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  fullName: z.string().min(2, "Le nom complet est requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "employee", "cashier"]),
  permissions: z.array(z.string()).default([]),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: any;
  onSuccess?: () => void;
}

function UserForm({ user, onSuccess }: UserFormProps) {
  const [open, setOpen] = useState(false);
  const [customPermissions, setCustomPermissions] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: user?.username || "",
      password: "",
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role: user?.role || "employee",
      permissions: user?.permissions || [],
    },
  });

  const selectedRole = form.watch("role");
  const selectedPermissions = form.watch("permissions");

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const permissions = customPermissions ? data.permissions : DEFAULT_PERMISSIONS[data.role];
      const userData = {
        ...data,
        permissions,
        email: data.email || null,
      };
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const permissions = customPermissions ? data.permissions : DEFAULT_PERMISSIONS[data.role];
      const userData = {
        ...data,
        permissions,
        email: data.email || null,
      };
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Utilisateur modifié avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setOpen(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    if (user) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const availablePermissions: Permission[] = [
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
  ];

  const togglePermission = (permission: Permission) => {
    const current = selectedPermissions || [];
    if (current.includes(permission)) {
      form.setValue("permissions", current.filter(p => p !== permission));
    } else {
      form.setValue("permissions", [...current, permission]);
    }
  };

  const getRoleName = (roleValue: string) => {
    switch (roleValue) {
      case "employee": return "Employé";
      case "cashier": return "Caissier";
      case "manager": return "Manager";
      case "admin": return "Administrateur";
      default: return "Sélectionner un rôle";
    }
  };

  return (
    // DÉBUT DE LA CORRECTION : ENVELOPPEZ LE TOUT DANS UN FRAGMENT
    <>
      <Button onClick={() => setOpen(true)}>
        {user ? <Edit className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
        {user ? "Modifier" : "Nouvel utilisateur"}
      </Button>
      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{user ? "Modifier l'utilisateur" : "Créer un nouvel utilisateur"}</h2>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Nom d'utilisateur *</Label>
                  <Input
                    id="username"
                    {...form.register("username")}
                    placeholder="nom_utilisateur"
                  />
                  {form.formState.errors.username && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.username.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet *</Label>
                  <Input
                    id="fullName"
                    {...form.register("fullName")}
                    placeholder="Prénom Nom"
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.fullName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {user ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe *"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register("password")}
                  placeholder="••••••••"
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    {...form.register("email")}
                    placeholder="email@exemple.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    {...form.register("phone")}
                    placeholder="+xxx xx xx xx xx"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rôle *</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => {
                    form.setValue("role", value as UserRole);
                    if (!customPermissions) {
                      form.setValue("permissions", DEFAULT_PERMISSIONS[value as UserRole]);
                    }
                  }}
                >
                  <SelectTrigger>
                    {/* MODIFICATION ICI : Contenu explicite pour SelectValue */}
                    <SelectValue>
                      {getRoleName(selectedRole)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employé</SelectItem>
                    <SelectItem value="cashier">Caissier</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomPermissions(!customPermissions);
                      if (!customPermissions) {
                        form.setValue("permissions", DEFAULT_PERMISSIONS[selectedRole]);
                      }
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    {customPermissions ? "Utiliser permissions par défaut" : "Personnaliser les permissions"}
                  </Button>
                </div>

                {customPermissions && (
                  <div className="space-y-3 p-4 border rounded-lg">
                    <Label>Permissions personnalisées</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {availablePermissions.map((permission) => (
                        <label
                          key={permission}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions?.includes(permission) || false}
                            onChange={() => togglePermission(permission)}
                            className="rounded"
                          />
                          <span className="text-sm">{getPermissionDisplayName(permission)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? "En cours..." : user ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </> // FIN DE LA CORRECTION : FERMETURE DU FRAGMENT
  );
}

function UsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const headers = authService.getAuthHeaders();
      const response = await fetch("/api/users", {
        headers: headers,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch users");
      }
      return response.json();
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user status");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Succès",
        description: "Statut de l'utilisateur mis à jour",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Succès",
        description: "Utilisateur supprimé avec succès",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "all" || user.role === filterRole;

    return matchesSearch && matchesRole;
  });

  const handleToggleUserStatus = (userId: number, currentStatus: boolean) => {
    toggleUserStatusMutation.mutate({ userId, isActive: !currentStatus });
  };

  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-red-500";
      case "manager": return "bg-blue-500";
      case "employee": return "bg-green-500";
      case "cashier": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600">Gérez les comptes et permissions des employés</p>
        </div>
        <UserForm />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom, nom d'utilisateur ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48">
                <SelectValue>
                  {getRoleDisplayName(filterRole as UserRole)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="employee">Employé</SelectItem>
                <SelectItem value="cashier">Caissier</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user: any) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">{user.fullName}</h3>
                        <Badge className={`${getRoleBadgeColor(user.role)} text-white`}>
                          {getRoleDisplayName(user.role)}
                        </Badge>
                        {!user.isActive && (
                          <Badge variant="secondary">Inactif</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      {user.email && (
                        <p className="text-sm text-gray-500">{user.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                    >
                      {user.isActive ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Activer
                        </>
                      )}
                    </Button>

                    <UserForm user={user} />

                    {/* COMMENTEZ AlertDialog */}
                    {/* <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer l'utilisateur</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer l'utilisateur "{user.fullName}" ?
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog> */}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => { /* Logique de suppression temporaire si nécessaire */ console.log("Supprimer utilisateur", user.id); handleDeleteUser(user.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {user.permissions && user.permissions.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm font-medium text-gray-700 mb-2">Permissions :</p>
                    <div className="flex flex-wrap gap-1">
                      {user.permissions.slice(0, 5).map((permission: string) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {getPermissionDisplayName(permission as Permission)}
                        </Badge>
                      ))}
                      {user.permissions.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.permissions.length - 5} autres
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun utilisateur trouvé</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default UsersPage;
