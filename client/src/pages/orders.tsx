import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { OrderItem } from "@/components/order-item";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShoppingCart, Trash2 } from "lucide-react";
// COMMENTEZ CES IMPORTS D'ALERTDIALOG
// import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import authService from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

export default function Orders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer les tables pour la correspondance ID → numéro
  const { data: tables = [] } = useQuery({
    queryKey: ["/api/tables"],
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  const { data: allOrders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    refetchInterval: 3000, // Mise à jour toutes les 3 secondes
    refetchIntervalInBackground: true,
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
        headers: authService.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete order");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/daily"] });
      toast({
        title: "Succès",
        description: "Commande supprimée avec succès",
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

  const handleDeleteOrder = (orderId: number) => {
    deleteOrderMutation.mutate(orderId);
  };

  const { data: activeOrders = [] } = useQuery({
    queryKey: ["/api/orders", { active: true }],
  });

  const filteredOrders = allOrders.filter((order: any) => {
    // Trouver le numéro de table correspondant à l'ID
    const tableNumber = tables.find((table: any) => table.id === order.tableId)?.number || order.tableId;
    
    const matchesSearch = 
      order.id.toString().includes(searchTerm) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone?.includes(searchTerm) ||
      tableNumber.toString().includes(searchTerm);

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "active") return matchesSearch && order.status !== "completed" && order.status !== "cancelled";
    if (activeTab === "completed") return matchesSearch && order.status === "completed";
    if (activeTab === "cancelled") return matchesSearch && order.status === "cancelled";
    
    return matchesSearch && order.status === activeTab;
  });

  const getOrderCounts = () => {
    const counts = {
      all: allOrders.length,
      pending: allOrders.filter((o: any) => o.status === "pending").length,
      preparing: allOrders.filter((o: any) => o.status === "preparing").length,
      ready: allOrders.filter((o: any) => o.status === "ready").length,
      completed: allOrders.filter((o: any) => o.status === "completed").length,
      cancelled: allOrders.filter((o: any) => o.status === "cancelled").length,
    };
    return counts;
  };

  const counts = getOrderCounts();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
        <div className="flex items-center space-x-4">
          <Badge variant="outline">
            {activeOrders.length} commandes actives
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Rechercher par numéro, client, téléphone ou table..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            Toutes ({counts.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            En attente ({counts.pending})
          </TabsTrigger>
          <TabsTrigger value="preparing">
            Préparation ({counts.preparing})
          </TabsTrigger>
          <TabsTrigger value="ready">
            Prêtes ({counts.ready})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Terminées ({counts.completed})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Annulées ({counts.cancelled})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order: any) => (
                <div key={order.id} className="flex items-start gap-4">
                  <div className="flex-1">
                    <OrderItem order={order} />
                  </div>
                  <div className="flex-shrink-0 pt-4">
                    {/* COMMENTEZ AlertDialog */}
                    {/* <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer cette commande</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la commande #{order.id} ? 
                            Cette action ne peut pas être annulée. La commande sera déplacée vers les archives.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteOrder(order.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog> */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => { /* Logique de suppression temporaire si nécessaire */ console.log("Supprimer commande", order.id); handleDeleteOrder(order.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune commande trouvée
                </h3>
                <p className="text-gray-500 text-center">
                  {searchTerm
                    ? "Aucune commande ne correspond à votre recherche."
                    : activeTab === "all"
                    ? "Aucune commande n'a encore été passée."
                    : `Aucune commande dans l'état "${activeTab}".`}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
