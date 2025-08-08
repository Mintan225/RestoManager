var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ChefHat, Package, CheckCircle, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
export function OrderStatusTracker({ tableId }) {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const fetchOrders = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(`/api/menu/${tableId}`);
                const data = yield response.json();
                setOrders(data.orders || []);
                setIsLoading(false);
            }
            catch (error) {
                console.error("Erreur lors du chargement des commandes:", error);
                setIsLoading(false);
            }
        });
        fetchOrders();
        // Actualiser toutes les 10 secondes
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [tableId]);
    const getStatusInfo = (status) => {
        switch (status) {
            case "pending":
                return {
                    icon: Clock,
                    text: "En attente",
                    color: "bg-yellow-500",
                    description: "Commande reçue"
                };
            case "preparing":
                return {
                    icon: ChefHat,
                    text: "En préparation",
                    color: "bg-blue-500",
                    description: "En cours de préparation"
                };
            case "ready":
                return {
                    icon: Package,
                    text: "Prête",
                    color: "bg-green-500",
                    description: "Prête à récupérer"
                };
            case "completed":
                return {
                    icon: CheckCircle,
                    text: "Terminée",
                    color: "bg-gray-500",
                    description: "Commande livrée"
                };
            default:
                return {
                    icon: Bell,
                    text: "Inconnue",
                    color: "bg-gray-500",
                    description: "Statut inconnu"
                };
        }
    };
    if (isLoading) {
        return (<Card>
        <CardHeader>
          <CardTitle>Vos Commandes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>);
    }
    if (orders.length === 0) {
        return (<Card>
        <CardHeader>
          <CardTitle>Vos Commandes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">
            Aucune commande en cours pour cette table.
          </p>
        </CardContent>
      </Card>);
    }
    return (<Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5"/>
          Vos Commandes ({orders.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;
            return (<div key={order.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${statusInfo.color}`}>
                  <StatusIcon className="h-4 w-4 text-white"/>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Commande #{order.id}</span>
                    <Badge className={`${statusInfo.color} text-white`}>
                      {statusInfo.text}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{statusInfo.description}</p>
                  {order.customerName && (<p className="text-xs text-gray-500">{order.customerName}</p>)}
                </div>
              </div>
              
              <div className="text-right">
                <p className="font-medium">{formatCurrency(parseFloat(order.total))}</p>
                <p className="text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                })}
                </p>
              </div>
            </div>);
        })}
        
        <div className="text-center pt-3 border-t">
          <p className="text-xs text-gray-500">
            Mise à jour automatique toutes les 10 secondes
          </p>
        </div>
      </CardContent>
    </Card>);
}
