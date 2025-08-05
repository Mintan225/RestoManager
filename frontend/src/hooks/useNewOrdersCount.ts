import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

export function useNewOrdersCount() {
  const [lastCheckedCount, setLastCheckedCount] = useState<number | null>(null);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const { data: activeOrders = [] } = useQuery({
    queryKey: ["/api/orders", { active: true }],
    refetchInterval: 5000, // Vérifier toutes les 5 secondes
  });

  // Filtrer les commandes avec statut "pending" (nouvelles commandes)
  const pendingOrders = activeOrders.filter((order: any) => order.status === 'pending');
  const currentPendingCount = pendingOrders.length;

  useEffect(() => {
    // Au premier chargement, établir la baseline sans afficher de notification
    if (lastCheckedCount === null) {
      setLastCheckedCount(currentPendingCount);
      setNewOrdersCount(0);
      return;
    }

    // Si le nombre de commandes "pending" a augmenté, afficher le total des pending
    if (currentPendingCount > lastCheckedCount) {
      setNewOrdersCount(currentPendingCount);
    } else if (currentPendingCount === 0) {
      // Si plus de commandes pending, réinitialiser
      setNewOrdersCount(0);
      setLastCheckedCount(0);
    }
  }, [currentPendingCount, lastCheckedCount]);

  // Fonction pour marquer les nouvelles commandes comme vues
  const markAsViewed = () => {
    setLastCheckedCount(currentPendingCount);
    // Garder la bulle visible mais ne plus la faire clignoter si il y a encore des commandes pending
    if (currentPendingCount === 0) {
      setNewOrdersCount(0);
    }
  };

  return {
    newOrdersCount,
    totalPendingOrders: currentPendingCount,
    markAsViewed,
  };
}