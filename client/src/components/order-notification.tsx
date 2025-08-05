import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Clock, ChefHat, Package, X } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface OrderNotificationProps {
  order: {
    id: number;
    status: string;
    customerName?: string;
    total: string;
    createdAt: string;
  };
  onClose?: () => void;
}

export function OrderNotification({ order, onClose }: OrderNotificationProps) {
  const [show, setShow] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShow(false);
    if (onClose) {
      setTimeout(() => {
        try {
          onClose();
        } catch (error) {
          console.warn('Error during notification close:', error);
        }
      }, 300); // Délai pour l'animation
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          icon: Clock,
          text: "Confirmée",
          color: "bg-yellow-500",
          message: "Commande confirmée ! Nous préparons tous..."
        };
      case "preparing":
        return {
          icon: ChefHat,
          text: "En préparation",
          color: "bg-blue-500",
          message: "Votre commande a été transmise au comptoir et est en préparation."
        };
      case "ready":
        return {
          icon: Package,
          text: "Prête",
          color: "bg-green-500",
          message: "Votre commande est prête ! Patientez un instant et vous serez servi."
        };
      case "completed":
        return {
          icon: CheckCircle,
          text: "Livrée",
          color: "bg-gray-500",
          message: "Commande livrée avec succès. Merci de votre visite !"
        };
      default:
        return {
          icon: Bell,
          text: "Mise à jour",
          color: "bg-gray-500",
          message: "Le statut de votre commande a été mis à jour."
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  if (!show) return null;

  return (
    <div 
      className={`fixed top-4 right-4 z-50 w-96 transition-all duration-300 ${
        show ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0'
      }`}
    >
      <Card className="shadow-lg border-l-4 border-l-primary">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-full ${statusInfo.color}`}>
              <StatusIcon className="h-4 w-4 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-sm">Commande #{order.id}</h4>
                <Badge className={`${statusInfo.color} text-white`}>
                  {statusInfo.text}
                </Badge>
              </div>
              
              {order.customerName && (
                <p className="text-sm text-gray-600 mb-1">{order.customerName}</p>
              )}
              
              <p className="text-sm text-gray-800 mb-2">{statusInfo.message}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Total: {formatCurrency(parseFloat(order.total))}</span>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  aria-label="Fermer la notification"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook pour écouter les mises à jour des commandes avec gestion robuste
export function useOrderNotifications(tableId?: number, customerName?: string, customerPhone?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastOrderStatuses, setLastOrderStatuses] = useState<Record<number, string>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!tableId || tableId === 0) return;

    const checkForUpdates = async () => {
      try {
        const response = await fetch(`/api/menu/${tableId}?t=${Date.now()}`);
        if (!response.ok) return;
        
        const data = await response.json();
        const currentOrders = data.orders || [];
        
        // Filtrer les commandes pour ce client spécifique
        const customerOrders = currentOrders.filter((order: any) => {
          if (customerName && customerPhone) {
            return order.customerName?.toLowerCase() === customerName.toLowerCase() && 
                   order.customerPhone === customerPhone;
          } else if (customerName) {
            return order.customerName?.toLowerCase() === customerName.toLowerCase();
          } else if (customerPhone) {
            return order.customerPhone === customerPhone;
          }
          return false; // Si pas d'info client, ne rien afficher
        });
        
        // Vérifier les changements de statut pour les commandes du client
        customerOrders.forEach((order: any) => {
          const previousStatus = lastOrderStatuses[order.id];
          
          // Débogage pour voir les changements de statut
          if (process.env.NODE_ENV === 'development') {
            console.log("Notification check:", {
              orderId: order.id,
              previousStatus,
              currentStatus: order.status,
              hasChanged: previousStatus && previousStatus !== order.status,
              timestamp: new Date().toLocaleTimeString()
            });
          }
          
          if (previousStatus && previousStatus !== order.status && 
              (order.status === "preparing" || order.status === "ready" || order.status === "completed")) {
            
            const notificationId = `${order.id}-${order.status}-${Date.now()}`;
            
            console.log("Creating notification for status change:", {
              orderId: order.id,
              fromStatus: previousStatus,
              toStatus: order.status,
              notificationId
            });
            
            setNotifications(prev => {
              // Éviter les doublons et limiter le nombre de notifications
              const exists = prev.some(n => n.notificationId === notificationId);
              if (!exists) {
                const newNotifications = [...prev, { 
                  ...order, 
                  notificationId,
                  timestamp: Date.now(),
                  isStatusChange: true 
                }];
                // Limiter à 3 notifications maximum pour éviter l'encombrement
                return newNotifications.slice(-3);
              }
              return prev;
            });
          }
        });
        
        // Mettre à jour le cache des statuts pour les commandes du client
        const newStatuses: Record<number, string> = {};
        customerOrders.forEach((order: any) => {
          newStatuses[order.id] = order.status;
        });
        
        // Pour la première fois, initialiser les statuts sans déclencher de notifications
        setLastOrderStatuses(prev => {
          if (Object.keys(prev).length === 0) {
            console.log("Initializing status cache:", newStatuses);
            return newStatuses;
          }
          return newStatuses;
        });
        
      } catch (error) {
        console.error("Erreur lors de la vérification des mises à jour:", error);
      }
    };

    // Vérification initiale immédiate pour initialiser les statuts
    checkForUpdates();
    
    // Vérification initiale après un délai
    const initialTimer = setTimeout(checkForUpdates, 1000);
    
    // Intervalle régulier - réduit à 2 secondes pour plus de réactivité
    intervalRef.current = setInterval(checkForUpdates, 2000);

    return () => {
      clearTimeout(initialTimer);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [tableId, customerName, customerPhone]);

  const removeNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
  };

  // Nettoyer automatiquement les notifications anciennes
  useEffect(() => {
    const cleanupTimer = setInterval(() => {
      setNotifications(prev => {
        const now = Date.now();
        return prev.filter(n => now - n.timestamp < 30000); // Supprimer après 30 secondes
      });
    }, 10000); // Nettoyer toutes les 10 secondes

    return () => clearInterval(cleanupTimer);
  }, []);

  return { notifications, removeNotification };
}