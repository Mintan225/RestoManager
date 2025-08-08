var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Users, Package, ShoppingCart, Receipt, CreditCard, QrCode } from "lucide-react";
import SuperAdminLayout from "@/components/super-admin-layout";
export default function SuperAdminDataManagement() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const [deleteId, setDeleteId] = useState(null);
    const [deleteType, setDeleteType] = useState("");
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { data: allData, isLoading } = useQuery({
        queryKey: ["/api/super-admin/all-data"],
        queryFn: () => __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch("/api/super-admin/all-data", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
                },
            });
            if (!response.ok)
                throw new Error("Failed to fetch data");
            return response.json();
        }),
    });
    const deleteMutation = useMutation({
        mutationFn: (_a) => __awaiter(this, [_a], void 0, function* ({ type, id }) {
            const response = yield fetch(`/api/super-admin/${type}/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("superAdminToken")}`,
                },
            });
            if (!response.ok)
                throw new Error("Failed to delete item");
            return response.json();
        }),
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
    const handleDelete = (type, id) => {
        setDeleteType(type);
        setDeleteId(id);
    };
    const confirmDelete = () => {
        if (deleteId && deleteType) {
            deleteMutation.mutate({ type: deleteType, id: deleteId });
        }
    };
    if (isLoading) {
        return (<div className="p-6">
        <div className="text-center">Chargement des données...</div>
      </div>);
    }
    if (!allData) {
        return (<div className="p-6">
        <div className="text-center text-red-600">Erreur lors du chargement des données</div>
      </div>);
    }
    return (<SuperAdminLayout title="Gestion des données" showBackButton={true}>
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
            <Package className="h-4 w-4"/>
            Produits
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4"/>
            Commandes
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <Receipt className="h-4 w-4"/>
            Ventes
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4"/>
            Dépenses
          </TabsTrigger>
          <TabsTrigger value="tables" className="flex items-center gap-2">
            <QrCode className="h-4 w-4"/>
            Tables
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4"/>
            Utilisateurs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Produits ({((_a = allData.products) === null || _a === void 0 ? void 0 : _a.length) || 0})</CardTitle>
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
                  {(_b = allData.products) === null || _b === void 0 ? void 0 : _b.map((product) => (<TableRow key={product.id}>
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
                        <Button variant="destructive" size="sm" onClick={() => handleDelete("products", product.id)} className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4"/>
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Commandes ({((_c = allData.orders) === null || _c === void 0 ? void 0 : _c.length) || 0})</CardTitle>
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
                  {(_d = allData.orders) === null || _d === void 0 ? void 0 : _d.map((order) => (<TableRow key={order.id}>
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
                        <Button variant="destructive" size="sm" onClick={() => handleDelete("orders", order.id)} className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4"/>
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle>Ventes ({((_e = allData.sales) === null || _e === void 0 ? void 0 : _e.length) || 0})</CardTitle>
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
                  {(_f = allData.sales) === null || _f === void 0 ? void 0 : _f.map((sale) => (<TableRow key={sale.id}>
                      <TableCell>{sale.id}</TableCell>
                      <TableCell>{sale.amount} FCFA</TableCell>
                      <TableCell>{sale.paymentMethod}</TableCell>
                      <TableCell>{sale.description || "N/A"}</TableCell>
                      <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete("sales", sale.id)} className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4"/>
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Dépenses ({((_g = allData.expenses) === null || _g === void 0 ? void 0 : _g.length) || 0})</CardTitle>
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
                  {(_h = allData.expenses) === null || _h === void 0 ? void 0 : _h.map((expense) => (<TableRow key={expense.id}>
                      <TableCell>{expense.id}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.amount} FCFA</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell>{new Date(expense.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete("expenses", expense.id)} className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4"/>
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tables">
          <Card>
            <CardHeader>
              <CardTitle>Tables ({((_j = allData.tables) === null || _j === void 0 ? void 0 : _j.length) || 0})</CardTitle>
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
                  {(_k = allData.tables) === null || _k === void 0 ? void 0 : _k.map((table) => (<TableRow key={table.id}>
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
                        <Button variant="destructive" size="sm" onClick={() => handleDelete("tables", table.id)} className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4"/>
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs ({((_l = allData.users) === null || _l === void 0 ? void 0 : _l.length) || 0})</CardTitle>
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
                  {(_m = allData.users) === null || _m === void 0 ? void 0 : _m.map((user) => (<TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role}</Badge>
                      </TableCell>
                      <TableCell>{user.email || "N/A"}</TableCell>
                      <TableCell>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete("users", user.id)} className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4"/>
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>))}
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
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </SuperAdminLayout>);
}
