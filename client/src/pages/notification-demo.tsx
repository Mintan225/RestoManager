import { useState } from "react";
import { OrderNotification } from "@/components/order-notification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const demoOrders = [
  {
    id: 1,
    status: "pending",
    customerName: "Alice Dupont",
    total: "15000",
    createdAt: new Date().toISOString(),
    notificationId: "demo-pending"
  },
  {
    id: 2,
    status: "preparing",
    customerName: "Bob Martin",
    total: "8500",
    createdAt: new Date().toISOString(),
    notificationId: "demo-preparing"
  },
  {
    id: 3,
    status: "ready",
    customerName: "Claire Bernard",
    total: "12300",
    createdAt: new Date().toISOString(),
    notificationId: "demo-ready"
  },
  {
    id: 4,
    status: "completed",
    customerName: "David Leroy",
    total: "9800",
    createdAt: new Date().toISOString(),
    notificationId: "demo-completed"
  }
];

export default function NotificationDemo() {
  const [activeNotifications, setActiveNotifications] = useState<any[]>([]);

  const showNotification = (order: any) => {
    const notification = { ...order, notificationId: `${order.id}-${Date.now()}` };
    setActiveNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (notificationId: string) => {
    setActiveNotifications(prev => prev.filter(n => n.notificationId !== notificationId));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Démonstration des Notifications Client
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Types de Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {demoOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">Commande #{order.id}</p>
                    <p className="text-sm text-gray-600">Statut: {order.status}</p>
                    <p className="text-sm text-gray-600">Client: {order.customerName}</p>
                  </div>
                  <Button 
                    onClick={() => showNotification(order)}
                    size="sm"
                  >
                    Afficher
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description des Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 border-l-4 border-yellow-500 bg-yellow-50">
                  <h4 className="font-medium text-yellow-800">Confirmée</h4>
                  <p className="text-sm text-yellow-700">Commande confirmée ! Nous préparons votre délicieux repas.</p>
                </div>
                
                <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
                  <h4 className="font-medium text-blue-800">En préparation</h4>
                  <p className="text-sm text-blue-700">Votre commande a été transmise au comptoir et est en préparation.</p>
                </div>
                
                <div className="p-3 border-l-4 border-green-500 bg-green-50">
                  <h4 className="font-medium text-green-800">Prête</h4>
                  <p className="text-sm text-green-700">Votre commande est prête ! Patientez un instant et vous serez servi.</p>
                </div>
                
                <div className="p-3 border-l-4 border-gray-500 bg-gray-50">
                  <h4 className="font-medium text-gray-800">Livrée</h4>
                  <p className="text-sm text-gray-700">Commande livrée avec succès. Merci de votre visite !</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Caractéristiques des Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Fonctionnalités :</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Apparition automatique en haut à droite</li>
                  <li>• Animation fluide d'entrée et de sortie</li>
                  <li>• Disparition automatique après 5 secondes</li>
                  <li>• Bouton de fermeture manuelle</li>
                  <li>• Couleurs distinctives par statut</li>
                  <li>• Icônes visuelles pour chaque état</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Informations affichées :</h4>
                <ul className="space-y-2 text-sm">
                  <li>• Numéro de commande</li>
                  <li>• Nom du client</li>
                  <li>• Statut actuel avec badge coloré</li>
                  <li>• Message descriptif personnalisé</li>
                  <li>• Montant total de la commande</li>
                  <li>• Icône de statut dans un cercle coloré</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <Button 
            onClick={() => setActiveNotifications([])}
            variant="outline"
          >
            Effacer toutes les notifications
          </Button>
        </div>
      </div>

      {/* Rendu des notifications actives */}
      {activeNotifications.map((notification) => (
        <OrderNotification
          key={notification.notificationId}
          order={notification}
          onClose={() => removeNotification(notification.notificationId)}
        />
      ))}
    </div>
  );
}