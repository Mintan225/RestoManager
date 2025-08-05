import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Users, Package, ShoppingCart, Receipt, CreditCard, QrCode } from "lucide-react";
import SuperAdminLayout from "@/components/super-admin-layout";

export default function SuperAdminDataManagement() {
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allData, isLoading } = useQuery({
    queryKey: ["/api/super-admin/all-data"],
    queryFn: async () => {
      const response = await fetch("/api/super-admin/all-data", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch data");
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      const response = await fetch(`/api/super-admin/${type}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete item");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Suppression réussie",
        description: "L'élément a été supprimé avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/all-data"] });
      setDeleteId(null);
      setDeleteType("");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Échec de la suppression de l'élément.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (type: string, id: number) => {
    setDeleteType(type);
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId && deleteType) {
      deleteMutation.mutate({ type: deleteType, id: deleteId });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Chargement des données...</div>
      </div>
    );
  }

  if (!allData) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Erreur lors du chargement des données</div>
      </div>
    );
  }

  return (
    <SuperAdminLayout title="Gestion des données" showBackButton={true}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Données</h1>
          <p className="text-gray-600 mt-2">
            Gérez et supprimez tous les éléments du système depuis cette interface centralisée.
          </p>
        </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Produits
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Commandes
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Ventes
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Dépenses
          </TabsTrigger>
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Tables
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Produits ({allData.products?.length || 0})</CardTitle>
              <CardDescription>Liste de tous les produits du système</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allData.products?.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.id}</TableCell>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.price} FCFA</TableCell>
                      <TableCell>{product.categoryId}</TableCell>
                      <TableCell>
                        <Badge variant={product.available ? "default" : "secondary"}>
                          {product.available ? "Disponible" : "Indisponible"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete("products", product.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Commandes ({allData.orders?.length || 0})</CardTitle>
              <CardDescription>Liste de toutes les commandes du système</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allData.orders?.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.id}</TableCell>
                      <TableCell>Table {order.tableId}</TableCell>
                      <TableCell>{order.customerName || "N/A"}</TableCell>
                      <TableCell>{order.total} FCFA</TableCell>
                      <TableCell>
                        <Badge variant={order.status === "completed" ? "default" : "secondary"}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete("orders", order.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Ventes ({allData.sales?.length || 0})</CardTitle>
              <CardDescription>Liste de toutes les ventes du système</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Méthode de paiement</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allData.sales?.map((sale: any) => (
                    <TableRow key={sale.id}>
                      <TableCell>{sale.id}</TableCell>
                      <TableCell>{sale.amount} FCFA</TableCell>
                      <TableCell>{sale.paymentMethod}</TableCell>
                      <TableCell>{sale.description || "N/A"}</TableCell>
                      <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete("sales", sale.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Dépenses ({allData.expenses?.length || 0})</CardTitle>
              <CardDescription>Liste de toutes les dépenses du système</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allData.expenses?.map((expense: any) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.id}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.amount} FCFA</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete("expenses", expense.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>Tables ({allData.tables?.length || 0})</CardTitle>
              <CardDescription>Liste de toutes les tables du système</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Capacité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allData.tables?.map((table: any) => (
                    <TableRow key={table.id}>
                      <TableCell>{table.id}</TableCell>
                      <TableCell>Table {table.number}</TableCell>
                      <TableCell>{table.capacity} places</TableCell>
                      <TableCell>
                        <Badge variant={table.status === "available" ? "default" : "secondary"}>
                          {table.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{table.qrCode}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete("tables", table.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs ({allData.users?.length || 0})</CardTitle>
              <CardDescription>Liste de tous les utilisateurs du système</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom d'utilisateur</TableHead>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allData.users?.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{user.email || "N/A"}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete("users", user.id)}
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cet élément ? Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </SuperAdminLayout>
  );
}