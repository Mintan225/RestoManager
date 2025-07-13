import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import  authService  from "@/lib/auth";
import { User, Settings as SettingsIcon, Shield, Database, Bell } from "lucide-react";

export default function Settings() {
  const user = authService.getUser();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Paramètres</h1>
          <p className="text-gray-600">Gérez les paramètres de votre restaurant</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profil utilisateur */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profil utilisateur
            </CardTitle>
            <CardDescription>
              Informations sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom d'utilisateur</Label>
              <Input value={user?.username || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Input value={user?.role || ""} disabled />
            </div>
            <Button variant="outline" className="w-full">
              Modifier le mot de passe
            </Button>
          </CardContent>
        </Card>

        {/* Paramètres du restaurant */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Restaurant
            </CardTitle>
            <CardDescription>
              Configuration générale
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du restaurant</Label>
              <Input placeholder="Mon Restaurant" />
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input placeholder="123 Rue de la Paix" />
            </div>
            <div className="space-y-2">
              <Label>Téléphone</Label>
              <Input placeholder="+33 1 23 45 67 89" />
            </div>
            <Button className="w-full">
              Enregistrer
            </Button>
          </CardContent>
        </Card>

        {/* Paramètres système */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Système
            </CardTitle>
            <CardDescription>
              Paramètres techniques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Sauvegarde automatique</Label>
                <p className="text-xs text-gray-500">Sauvegarde quotidienne des données</p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Notifications</Label>
                <p className="text-xs text-gray-500">Alertes pour nouvelles commandes</p>
              </div>
              <Bell className="h-4 w-4 text-gray-400" />
            </div>
            
            <Separator />
            
            <Button variant="outline" className="w-full">
              Exporter les données
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Informations système */}
      <Card>
        <CardHeader>
          <CardTitle>Informations système</CardTitle>
          <CardDescription>
            Détails techniques de l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Version</Label>
              <p className="text-lg font-semibold">v1.0.0</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Base de données</Label>
              <p className="text-lg font-semibold">PostgreSQL</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-600">Statut</Label>
              <p className="text-lg font-semibold text-green-600">Opérationnel</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}