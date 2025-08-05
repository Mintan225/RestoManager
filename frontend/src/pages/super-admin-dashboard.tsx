import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Database, 
  Trash2, 
  UserPlus, 
  AlertTriangle,
  RefreshCw,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
// Removed apiRequest import - using native fetch instead
import { useLocation } from "wouter";
import SuperAdminLayout from "@/components/super-admin-layout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SuperAdminDashboard() {
  const [superAdmin, setSuperAdmin] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resetLoading, setResetLoading] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: ""
  });
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("superAdminToken");
      if (!token) {
        setLocation("/super-admin/login");
        return;
      }

      const response = await fetch("/api/super-admin/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Authentication failed");
      }

      const data = await response.json();
      setSuperAdmin(data);
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("superAdminToken");
      setLocation("/super-admin/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("superAdminToken");
      const response = await fetch("/api/super-admin/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newAdmin),
      });

      if (!response.ok) {
        throw new Error("Failed to create admin");
      }

      toast({
        title: "Succès",
        description: "Administrateur créé avec succès",
      });

      setNewAdmin({
        username: "",
        password: "",
        fullName: "",
        email: "",
        phone: ""
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la création de l'administrateur",
        variant: "destructive",
      });
    }
  };

  const handleResetSystem = async () => {
    setResetLoading(true);
    try {
      const token = localStorage.getItem("superAdminToken");
      const response = await fetch("/api/super-admin/reset-system", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Reset failed");
      }

      toast({
        title: "Système réinitialisé",
        description: "Le système a été complètement réinitialisé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Échec de la réinitialisation du système",
        variant: "destructive",
      });
    } finally {
      setResetLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-red-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <SuperAdminLayout title="Portail de gestion système">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Créer un administrateur */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <UserPlus className="h-5 w-5 mr-2" />
              Créer un administrateur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  value={newAdmin.username}
                  onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                  required
                  className="border-red-200 focus:border-red-500"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  required
                  className="border-red-200 focus:border-red-500"
                />
              </div>
              
              <div>
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  value={newAdmin.fullName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                  required
                  className="border-red-200 focus:border-red-500"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="border-red-200 focus:border-red-500"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={newAdmin.phone}
                  onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                  className="border-red-200 focus:border-red-500"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Créer l'administrateur
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Actions système */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <Settings className="h-5 w-5 mr-2" />
              Actions système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Accès au portail normal */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Portail Restaurant</h3>
              <p className="text-sm text-gray-600 mb-3">
                Accéder au portail de gestion restaurant normal
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open("/", "_blank")}
                  variant="outline"
                  className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Portail Restaurant
                </Button>
                
                <Button 
                  onClick={() => setLocation("/super-admin/system-config")}
                  variant="outline"
                  className="flex-1 border-purple-200 text-purple-600 hover:bg-purple-50"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configuration
                </Button>
              </div>
              
              <div className="flex gap-2 mt-2">
                <Button 
                  onClick={() => setLocation("/super-admin/data-management")}
                  variant="outline"
                  className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Gestion des données
                </Button>
              </div>
            </div>

            {/* Réinitialisation complète */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-red-800 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Zone dangereuse
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Réinitialise complètement le système pour un nouveau restaurant. 
                Cette action supprime TOUTES les données et ne peut pas être annulée.
              </p>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Réinitialiser le système
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-red-800">
                      Réinitialisation complète du système
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Cette action va supprimer DÉFINITIVEMENT :
                      <br />• Tous les utilisateurs, produits, catégories
                      <br />• Toutes les commandes, ventes et dépenses  
                      <br />• Toutes les tables et codes QR
                      <br />• Toutes les données système
                      <br /><br />
                      <strong>Cette action ne peut pas être annulée !</strong>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetSystem}
                      disabled={resetLoading}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {resetLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Réinitialisation...
                        </>
                      ) : (
                        "Oui, réinitialiser"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}