import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
import { 
  Plus, Edit, Trash, Eye, EyeOff, Upload, Download, Settings,
  Table as TabsIcon, Clock, CheckCircle, AlertCircle
} from "lucide-react";

interface SystemTab {
  id: number;
  name: string;
  path: string;
  icon?: string;
  isActive: boolean;
  order: number;
  requiredPermissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface SystemUpdate {
  id: number;
  version: string;
  description?: string;
  changelog?: string;
  isDeployed: boolean;
  deployedAt?: string;
  createdAt: string;
}

interface SystemSetting {
  id: number;
  key: string;
  value?: string;
  description?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function SystemConfig() {
  const { toast } = useToast();
  const [tabs, setTabs] = useState<SystemTab[]>([]);
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [newTab, setNewTab] = useState({
    name: "",
    path: "",
    icon: "",
    order: 0,
    requiredPermissions: [] as string[]
  });
  
  const [newUpdate, setNewUpdate] = useState({
    version: "",
    description: "",
    changelog: ""
  });

  const [systemName, setSystemName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("superAdminToken");
      
      const [tabsResponse, updatesResponse, settingsResponse] = await Promise.all([
        fetch("/api/super-admin/system-tabs", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/super-admin/system-updates", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/super-admin/system-settings", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (tabsResponse.ok && updatesResponse.ok && settingsResponse.ok) {
        const tabsData = await tabsResponse.json();
        const updatesData = await updatesResponse.json();
        const settingsData = await settingsResponse.json();
        
        setTabs(tabsData);
        setUpdates(updatesData);
        setSettings(settingsData);
        
        // Trouver le nom du système dans les paramètres
        const appNameSetting = settingsData.find((s: SystemSetting) => s.key === "app_name");
        if (appNameSetting) {
          setSystemName(appNameSetting.value || "");
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTab = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("superAdminToken");
      const response = await fetch("/api/super-admin/system-tabs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newTab)
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Onglet créé avec succès"
        });
        setNewTab({ name: "", path: "", icon: "", order: 0, requiredPermissions: [] });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'onglet",
        variant: "destructive"
      });
    }
  };

  const handleToggleTab = async (id: number) => {
    try {
      const token = localStorage.getItem("superAdminToken");
      const response = await fetch(`/api/super-admin/system-tabs/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        loadData();
        toast({
          title: "Succès",
          description: "Statut de l'onglet modifié"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTab = async (id: number) => {
    try {
      const token = localStorage.getItem("superAdminToken");
      const response = await fetch(`/api/super-admin/system-tabs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        loadData();
        toast({
          title: "Succès",
          description: "Onglet supprimé avec succès"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("superAdminToken");
      const response = await fetch("/api/super-admin/system-updates", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newUpdate)
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Mise à jour créée avec succès"
        });
        setNewUpdate({ version: "", description: "", changelog: "" });
        loadData();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la mise à jour",
        variant: "destructive"
      });
    }
  };

  const handleDeployUpdate = async (id: number) => {
    try {
      const token = localStorage.getItem("superAdminToken");
      const response = await fetch(`/api/super-admin/system-updates/${id}/deploy`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        loadData();
        toast({
          title: "Succès",
          description: "Mise à jour déployée avec succès"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du déploiement",
        variant: "destructive"
      });
    }
  };

  const handleUpdateSystemName = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem("superAdminToken");
      
      // Vérifier si le paramètre existe déjà
      const existingSetting = settings.find(s => s.key === "app_name");
      
      if (existingSetting) {
        // Mettre à jour
        const response = await fetch("/api/super-admin/system-settings/app_name", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ value: systemName })
        });

        if (response.ok) {
          toast({
            title: "Succès",
            description: "Nom du logiciel mis à jour avec succès"
          });
          loadData();
        }
      } else {
        // Créer
        const response = await fetch("/api/super-admin/system-settings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            key: "app_name",
            value: systemName,
            description: "Nom personnalisé de l'application",
            category: "branding"
          })
        });

        if (response.ok) {
          toast({
            title: "Succès",
            description: "Nom du logiciel configuré avec succès"
          });
          loadData();
        }
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du nom",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Settings className="mx-auto h-12 w-12 animate-spin text-red-600 mb-4" />
          <p className="text-lg">Chargement de la configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <SuperAdminLayout title="Configuration système" showBackButton={true}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-red-600">Configuration Système</h1>
          <p className="text-gray-600">Gérez les onglets et mises à jour du système</p>
        </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres
          </TabsTrigger>
          <TabsTrigger value="tabs" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Onglets Système
          </TabsTrigger>
          <TabsTrigger value="updates" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Mises à jour
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* Configuration du nom du logiciel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Nom du logiciel
              </CardTitle>
              <CardDescription>
                Personnalisez le nom de votre application (ex: "Restaurant Manager", "Bar Manager", etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateSystemName} className="space-y-4">
                <div>
                  <Label htmlFor="systemName">Nom de l'application</Label>
                  <Input
                    id="systemName"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    placeholder="Ex: Restaurant Manager, Bar Manager..."
                    required
                  />
                </div>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  <Settings className="h-4 w-4 mr-2" />
                  Mettre à jour le nom
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Autres paramètres système */}
          <Card>
            <CardHeader>
              <CardTitle>Paramètres système</CardTitle>
              <CardDescription>
                Configuration avancée du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{setting.key.replace(/_/g, ' ').toUpperCase()}</div>
                      {setting.description && (
                        <div className="text-sm text-gray-500">{setting.description}</div>
                      )}
                      <div className="text-sm text-blue-600">{setting.value || "Non défini"}</div>
                    </div>
                    <Badge variant="outline">{setting.category}</Badge>
                  </div>
                ))}
                {settings.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Aucun paramètre configuré</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tabs" className="space-y-6">
          {/* Création d'onglet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Créer un nouvel onglet
              </CardTitle>
              <CardDescription>
                Ajouter un nouvel onglet au système de navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTab} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nom de l'onglet</Label>
                    <Input
                      id="name"
                      value={newTab.name}
                      onChange={(e) => setNewTab({ ...newTab, name: e.target.value })}
                      placeholder="Ex: Inventaire"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="path">Chemin</Label>
                    <Input
                      id="path"
                      value={newTab.path}
                      onChange={(e) => setNewTab({ ...newTab, path: e.target.value })}
                      placeholder="Ex: /inventory"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="icon">Icône (optionnel)</Label>
                    <Input
                      id="icon"
                      value={newTab.icon}
                      onChange={(e) => setNewTab({ ...newTab, icon: e.target.value })}
                      placeholder="Ex: Package"
                    />
                  </div>
                  <div>
                    <Label htmlFor="order">Ordre d'affichage</Label>
                    <Input
                      id="order"
                      type="number"
                      value={newTab.order}
                      onChange={(e) => setNewTab({ ...newTab, order: parseInt(e.target.value) })}
                      min="0"
                    />
                  </div>
                </div>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer l'onglet
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Liste des onglets */}
          <Card>
            <CardHeader>
              <CardTitle>Onglets existants</CardTitle>
              <CardDescription>
                Gérez les onglets de navigation du système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tabs.map((tab) => (
                  <div key={tab.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {tab.isActive ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="font-medium">{tab.name}</span>
                      </div>
                      <Badge variant="outline">{tab.path}</Badge>
                      <span className="text-sm text-gray-500">Ordre: {tab.order}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={tab.isActive}
                        onCheckedChange={() => handleToggleTab(tab.id)}
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer l'onglet</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer l'onglet "{tab.name}" ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTab(tab.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
                {tabs.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Aucun onglet configuré</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-6">
          {/* Création de mise à jour */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Créer une nouvelle mise à jour
              </CardTitle>
              <CardDescription>
                Préparer une mise à jour système pour déploiement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUpdate} className="space-y-4">
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    value={newUpdate.version}
                    onChange={(e) => setNewUpdate({ ...newUpdate, version: e.target.value })}
                    placeholder="Ex: v1.2.0"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newUpdate.description}
                    onChange={(e) => setNewUpdate({ ...newUpdate, description: e.target.value })}
                    placeholder="Description courte de la mise à jour"
                  />
                </div>
                <div>
                  <Label htmlFor="changelog">Notes de version</Label>
                  <Textarea
                    id="changelog"
                    value={newUpdate.changelog}
                    onChange={(e) => setNewUpdate({ ...newUpdate, changelog: e.target.value })}
                    placeholder="Détails des changements apportés..."
                    rows={4}
                  />
                </div>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer la mise à jour
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Liste des mises à jour */}
          <Card>
            <CardHeader>
              <CardTitle>Historique des mises à jour</CardTitle>
              <CardDescription>
                Gérez et déployez les mises à jour système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {updates.map((update) => (
                  <div key={update.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant={update.isDeployed ? "default" : "secondary"}>
                          {update.version}
                        </Badge>
                        {update.isDeployed ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm">Déployé</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-orange-600">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">En attente</span>
                          </div>
                        )}
                      </div>
                      {update.description && (
                        <p className="text-sm text-gray-600">{update.description}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        Créé le {new Date(update.createdAt).toLocaleDateString()}
                        {update.deployedAt && (
                          <span> • Déployé le {new Date(update.deployedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!update.isDeployed && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700" size="sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Déployer
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Déployer la mise à jour</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir déployer la version {update.version} ? Cette action ne peut pas être annulée.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeployUpdate(update.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Déployer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
                {updates.length === 0 && (
                  <p className="text-center text-gray-500 py-8">Aucune mise à jour créée</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </SuperAdminLayout>
  );
}