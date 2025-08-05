import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, ChefHat, Package, CheckCircle, X, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { useQuery } from "@tanstack/react-query";

interface OrderTrackingProps {
  tableId: number;
  customerName?: string;
  customerPhone?: string;
  onClose: () => void;
}

export function OrderTracking({ tableId, customerName, customerPhone, onClose }: OrderTrackingProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: menuData, isLoading, refetch } = useQuery({
    queryKey: [`/api/menu/${tableId}`],
    refetchInterval: autoRefresh ? 2000 : false, // Actualisation toutes les 2 secondes pour plus de réactivité
    enabled: !!tableId,
    refetchOnWindowFocus: true, // Actualiser quand la fenêtre redevient active
    staleTime: 0, // Les données sont considérées comme périmées immédiatement
    queryFn: async () => {
      const response = await fetch(`/api/menu/${tableId}?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch menu data');
      }
      return response.json();
    },
  });

  const orders = menuData?.orders || [];
  
  // Filtrer les commandes pour ce client spécifique
  const customerOrders = orders.filter((order: any) => {
    // Debug pour vérifier la synchronisation des mises à jour
    if (process.env.NODE_ENV === 'development') {
      console.log("Suivi commande - filtrage:", { 
        orderId: order.id,
        status: order.status,
        orderName: order.customerName,
        filterName: customerName,
        timestamp: new Date().toLocaleTimeString()
      });
    }
    
    if (customerName && customerPhone) {
      const nameMatch = order.customerName?.toLowerCase() === customerName.toLowerCase();
      const phoneMatch = order.customerPhone === customerPhone;
      return nameMatch && phoneMatch;
    } else if (customerName) {
      return order.customerName?.toLowerCase() === customerName.toLowerCase();
    } else if (customerPhone) {
      return order.customerPhone === customerPhone;
    }
    return false; // Si pas d'info client, ne rien afficher
  });
  
  const activeOrders = customerOrders.filter((order: any) => order.status !== 'completed');

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          text: "Confirmée",
          color: "bg-yellow-500",
          description: "Commande confirmée ! Nous préparons tous...",
          progress: 25
        };
      case "preparing":
        return {
          icon: ChefHat,
          text: "En préparation",
          color: "bg-blue-500",
          description: "Votre commande a été transmise au comptoir et est en préparation.",
          progress: 75
        };
      case "ready":
        return {
          icon: Package,
          text: "Prête",
          color: "bg-green-500",
          description: "Votre commande est prête ! Patientez un instant et vous serez servi.",
          progress: 100
        };
      case "completed":
        return {
          icon: CheckCircle,
          text: "Livrée",
          color: "bg-gray-500",
          description: "Commande livrée avec succès. Merci de votre visite !",
          progress: 100
        };
      default:
        return {
          icon: Clock,
          text: "En attente",
          color: "bg-gray-400",
          description: "Statut en cours de mise à jour...",
          progress: 0
        };
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl">Suivi de vos commandes</CardTitle>
            <p className="text-sm text-gray-600">
              Table {tableId}
              {customerName && <span> • {customerName}</span>}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "text-green-600" : "text-gray-400"}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">Chargement des commandes...</p>
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune commande active</h3>
              <p className="text-gray-600">
                {customerName 
                  ? `Aucune commande active pour ${customerName}.`
                  : "Passez une commande pour voir son suivi ici !"
                }
              </p>
            </div>
          ) : (
            activeOrders.map((order: any) => {
              const statusInfo = getStatusInfo(order.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={order.id} className="border-l-4" style={{ borderLeftColor: statusInfo.color.replace('bg-', '#') }}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${statusInfo.color}`}>
                          <StatusIcon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Commande #{order.id}</h3>
                          <p className="text-sm text-gray-600">
                            Passée à {formatTime(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <Badge className={`${statusInfo.color} text-white`}>
                        {statusInfo.text}
                      </Badge>
                    </div>

                    {/* Barre de progression */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progression</span>
                        <span>{statusInfo.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${statusInfo.color}`}
                          style={{ width: `${statusInfo.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">{statusInfo.description}</p>
                    
                    {order.customerName && (
                      <p className="text-sm text-gray-600 mb-2">
                        Client: {order.customerName}
                      </p>
                    )}

                    {/* Détails des articles */}
                    <div className="space-y-1 mb-3">
                      {order.orderItems?.map((item: any) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.quantity}x {item.product.name}</span>
                          <span>{formatCurrency(parseFloat(item.price) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-sm font-medium pt-2 border-t">
                      <span>Total:</span>
                      <span className="text-lg">{formatCurrency(parseFloat(order.total))}</span>
                    </div>

                    {order.status === 'ready' && (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                        🎉 Votre commande est prête ! Patientez un instant et vous serez servi.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}

          <div className="flex justify-between items-center pt-4 border-t text-xs text-gray-500">
            <span>
              {autoRefresh ? "Actualisation automatique activée" : "Actualisation manuelle"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}