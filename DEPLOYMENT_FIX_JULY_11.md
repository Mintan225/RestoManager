# Guide de Déploiement - Corrections du 11 Juillet 2025

## Problèmes Résolus dans cette Mise à Jour

### 1. ❗ Tables Occupées Dashboard en Temps Réel
- **Problème**: Le dashboard n'affichait pas les vraies tables occupées en temps réel
- **Solution**: Système de calcul automatique basé sur les commandes actives + statut des tables

### 2. 🔔 Système de Notification Bulle Rouge
- **Problème**: Personnel du comptoir pas alerté des nouvelles commandes
- **Solution**: Bulle rouge clignotante sur l'onglet "Commandes" dans la sidebar

## Fichiers Modifiés à Redéployer

### Frontend (Client)
```
client/src/components/sidebar.tsx       ← Bulle notification rouge
client/src/hooks/useNewOrdersCount.ts   ← Hook comptage commandes pending  
client/src/pages/dashboard.tsx          ← Dashboard temps réel tables occupées
```

### Backend (Serveur)
```
server/routes.ts                        ← Mise à jour automatique statut tables
```

## Instructions de Redéploiement

### Option 1: Redéploiement Complet (Recommandé)
1. Commitez tous les changements récents:
   ```bash
   git add .
   git commit -m "Fix: Dashboard temps réel + système notification bulle"
   git push origin main
   ```

2. Redéployez depuis Replit:
   - Cliquez sur "Deploy" dans l'interface Replit
   - Attendez la compilation complète
   - Vérifiez que les logs ne montrent aucune erreur

### Option 2: Vérification des Fichiers Clés
Si le redéploiement ne fonctionne pas, vérifiez que ces fichiers contiennent bien:

#### `client/src/components/sidebar.tsx` doit contenir:
```typescript
import { useNewOrdersCount } from "@/hooks/useNewOrdersCount";

// Dans le composant:
const { newOrdersCount, markAsViewed } = useNewOrdersCount();

// Dans la navigation:
{isOrdersTab && newOrdersCount > 0 && (
  <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
    {newOrdersCount > 9 ? '9+' : newOrdersCount}
  </span>
)}
```

#### `client/src/pages/dashboard.tsx` doit contenir:
```typescript
const { data: activeOrders = [], isLoading: ordersLoading } = useQuery({
  queryKey: ["/api/orders", { active: true }],
  refetchInterval: 3000, // Actualisation toutes les 3 secondes
});

const { data: tables = [] } = useQuery({
  queryKey: ["/api/tables"],
  refetchInterval: 5000, // Actualisation toutes les 5 secondes
});

// Calcul tables occupées en temps réel
const occupiedTableIds = new Set(
  activeOrders
    .filter((order: any) => order.status !== 'completed' && order.status !== 'cancelled')
    .map((order: any) => order.tableId)
);
```

#### `server/routes.ts` doit contenir:
```typescript
// Lors de création d'ordre:
await storage.updateTable(parseInt(tableId), { status: "occupied" });

// Lors de mise à jour d'ordre:
if (orderData.status === 'completed' || orderData.status === 'cancelled') {
  const activeOrders = await storage.getActiveOrders();
  const otherActiveOrders = activeOrders.filter((o: any) => 
    o.tableId === order.tableId && 
    o.id !== order.id && 
    o.status !== 'completed' && 
    o.status !== 'cancelled'
  );
  
  const tableStatus = otherActiveOrders.length === 0 ? "available" : "occupied";
  await storage.updateTable(order.tableId, { status: tableStatus });
}
```

## Tests après Déploiement

### 1. Test Bulle Notification
1. Créez une nouvelle commande via QR code
2. Connectez-vous au dashboard admin
3. Vérifiez qu'une bulle rouge apparaît sur "Commandes" dans la sidebar
4. Cliquez sur "Commandes" → la bulle doit disparaître

### 2. Test Tables Occupées
1. Créez une commande → table doit devenir "occupied"  
2. Terminez la commande → table doit redevenir "available"
3. Dashboard doit se mettre à jour automatiquement

### 3. Test Temps Réel
- Dashboard se rafraîchit toutes les 3-5 secondes
- Bulle notification se met à jour toutes les 5 secondes
- Statuts des tables changent automatiquement

## En Cas de Problème

### Si la Bulle Rouge n'Apparaît Pas:
```bash
# Vérifiez dans la console navigateur
F12 > Console > Recherchez erreurs React/Hook
```

### Si Tables Occupées ne Changent Pas:
```bash
# Testez l'API directement
curl -X GET "https://votre-app.replit.app/api/tables" 
curl -X GET "https://votre-app.replit.app/api/orders?active=true"
```

### Cache du Navigateur:
```bash
# Videz le cache complet:
Ctrl+Shift+R (ou Cmd+Shift+R sur Mac)
```

## Contact Support
Si les problèmes persistent après ces étapes, redémarrez complètement l'application depuis Replit et vérifiez les logs de build.