import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/currency";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import  authService  from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { downloadReceipt, type ReceiptData } from "@/lib/receipt-generator";
import { Download } from "lucide-react";

interface OrderItemProps {
  order: {
    id: number;
    tableId: number;
    customerName?: string;
    customerPhone?: string;
    status: string;
    paymentMethod?: string;
    paymentStatus: string;
    total: string;
    notes?: string;
    createdAt: string;
    orderItems: Array<{
      id: number;
      quantity: number;
      price: string;
      notes?: string;
      product: {
        id: number;
        name: string;
        description?: string;
        price: string;
      };
    }>;
  };
}

const statusConfig = {
  pending: { label: "En attente", color: "bg-warning" },
  preparing: { label: "Préparation", color: "bg-primary" },
  ready: { label: "Prêt", color: "bg-success" },
  completed: { label: "Terminé", color: "bg-gray-500" },
  cancelled: { label: "Annulé", color: "bg-destructive" },
};

const paymentStatusConfig = {
  pending: { label: "En attente", color: "bg-warning" },
  paid: { label: "Payé", color: "bg-success" },
  failed: { label: "Échec", color: "bg-destructive" },
};

export function OrderItem({ order }: OrderItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Récupérer les tables pour trouver le numéro de table correspondant à l'ID
  const { data: tables = [] } = useQuery({
    queryKey: ["/api/tables"],
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });
  
  const tableNumber = tables.find((table: any) => table.id === order.tableId)?.number || order.tableId;

  const updateOrderMutation = useMutation({
    mutationFn: async ({ status }: { status: string }) => {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: authService.getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update order");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Commande mise à jour",
      });
      // Invalider toutes les requêtes liées aux commandes
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/daily"] });
      // Invalider aussi les endpoints de menu utilisés par le suivi client
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0]?.toString().startsWith('/api/menu/');
        }
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

  const handleStatusChange = (newStatus: string) => {
    updateOrderMutation.mutate({ status: newStatus });
  };

  const handleDownloadReceipt = () => {
    if (!order.orderItems || order.orderItems.length === 0) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le reçu : aucun produit commandé",
        variant: "destructive",
      });
      return;
    }

    const receiptData: ReceiptData = {
      orderId: order.id,
      customerName: order.customerName || 'Client',
      customerPhone: order.customerPhone,
      tableNumber: tableNumber,
      items: order.orderItems.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: parseFloat(item.price) * item.quantity
      })),
      subtotal: parseFloat(order.total),
      total: parseFloat(order.total),
      paymentMethod: order.paymentMethod || 'Espèces',
      paymentDate: format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr }),
      restaurantName: 'Mon Restaurant',
      restaurantAddress: 'Adresse du restaurant',
      restaurantPhone: '+225 XX XX XX XX'
    };

    try {
      downloadReceipt(receiptData);
      toast({
        title: "Succès",
        description: "Reçu téléchargé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le reçu",
        variant: "destructive",
      });
    }
  };

  const statusInfo = statusConfig[order.status as keyof typeof statusConfig];
  const paymentInfo = paymentStatusConfig[order.paymentStatus as keyof typeof paymentStatusConfig];

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold">Commande #{order.id}</h3>
            <Badge className={`${statusInfo.color} text-white`}>
              {statusInfo.label}
            </Badge>
            <Badge className={`${paymentInfo.color} text-white`}>
              {paymentInfo.label}
            </Badge>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatCurrency(order.total)}</p>
            <p className="text-sm text-gray-500">
              {format(new Date(order.createdAt), "HH:mm", { locale: fr })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">
              <strong>Table:</strong> {tableNumber}
            </p>
            {order.customerName && (
              <p className="text-sm text-gray-600">
                <strong>Client:</strong> {order.customerName}
              </p>
            )}
            {order.customerPhone && (
              <p className="text-sm text-gray-600">
                <strong>Téléphone:</strong> {order.customerPhone}
              </p>
            )}
          </div>
          <div>
            {order.paymentMethod && (
              <p className="text-sm text-gray-600">
                <strong>Paiement:</strong> {order.paymentMethod}
              </p>
            )}
            {order.notes && (
              <p className="text-sm text-gray-600">
                <strong>Notes:</strong> {order.notes}
              </p>
            )}
          </div>
        </div>

        {/* Produits commandés */}
        {order.orderItems && order.orderItems.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Produits commandés :</h4>
            <div className="space-y-2">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <span className="font-medium">{item.product.name}</span>
                    {item.notes && (
                      <span className="text-sm text-gray-600 ml-2">({item.notes})</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-600">Qté: {item.quantity}</span>
                    <span className="font-medium">{formatCurrency(item.price)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center justify-between">
          {order.status !== "completed" && order.status !== "cancelled" && (
            <div className="flex space-x-2">
              {order.status === "pending" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("preparing")}
                  disabled={updateOrderMutation.isPending}
                >
                  Commencer préparation
                </Button>
              )}
              {order.status === "preparing" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("ready")}
                  disabled={updateOrderMutation.isPending}
                >
                  Marquer comme prêt
                </Button>
              )}
              {order.status === "ready" && (
                <Button
                  size="sm"
                  onClick={() => handleStatusChange("completed")}
                  disabled={updateOrderMutation.isPending}
                >
                  Terminer
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleStatusChange("cancelled")}
                disabled={updateOrderMutation.isPending}
              >
                Annuler
              </Button>
            </div>
          )}
          
          {/* Bouton de téléchargement du reçu - disponible pour toutes les commandes payées */}
          {order.paymentStatus === "paid" && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadReceipt}
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Télécharger reçu
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
