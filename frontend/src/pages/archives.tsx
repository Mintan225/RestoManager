import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Archive, Calendar, Euro, ShoppingCart, Trash2 } from "lucide-react";

export default function Archives() {
  const { data: deletedOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["/api/archives/orders"],
  });

  const { data: deletedSales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["/api/archives/sales"],
  });

  const { data: deletedExpenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["/api/archives/expenses"],
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "preparing":
        return "bg-blue-500";
      case "ready":
        return "bg-purple-500";
      case "completed":
        return "bg-green-500";
      case "cancelled":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "Espèces";
      case "orange_money":
        return "Orange Money";
      case "mtn_momo":
        return "MTN MoMo";
      case "moov":
        return "Moov";
      case "wave":
        return "Wave";
      default:
        return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case "cash":
        return "bg-green-500";
      case "orange_money":
        return "bg-orange-500";
      case "mtn_momo":
        return "bg-yellow-500";
      case "moov":
        return "bg-blue-500";
      case "wave":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Archive className="h-8 w-8 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">Archives</h1>
        <Badge variant="secondary">Éléments supprimés</Badge>
      </div>

      {/* Tabs for different archive types */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Commandes ({deletedOrders.length})
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <Euro className="h-4 w-4" />
            Ventes ({deletedSales.length})
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Dépenses ({deletedExpenses.length})
          </TabsTrigger>
        </TabsList>

        {/* Deleted Orders */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Commandes supprimées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : deletedOrders.length > 0 ? (
                <div className="space-y-4">
                  {deletedOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-3 border-b last:border-b-0 bg-gray-50 p-4 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              Commande #{order.id}
                            </p>
                            <p className="text-sm text-gray-500">
                              Supprimée le {format(new Date(order.deletedAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                            </p>
                          </div>
                          <Badge className={`${getStatusBadgeColor(order.status)} text-white`}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex items-center gap-4">
                          <span className="text-lg font-bold text-gray-900">
                            {formatCurrency(parseFloat(order.total))}
                          </span>
                          {order.customerName && (
                            <span className="text-sm text-gray-600">
                              Client: {order.customerName}
                            </span>
                          )}
                          {order.tableId && (
                            <span className="text-sm text-gray-600">
                              Table: {order.tableId}
                            </span>
                          )}
                        </div>
                        {order.orderItems?.length > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            {order.orderItems.length} article{order.orderItems.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune commande supprimée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deleted Sales */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="h-5 w-5" />
                Ventes supprimées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : deletedSales.length > 0 ? (
                <div className="space-y-4">
                  {deletedSales.map((sale: any) => (
                    <div
                      key={sale.id}
                      className="flex items-center justify-between py-3 border-b last:border-b-0 bg-gray-50 p-4 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(parseFloat(sale.amount))}
                            </p>
                            <p className="text-sm text-gray-500">
                              Supprimée le {format(new Date(sale.deletedAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                            </p>
                          </div>
                          <Badge className={`${getPaymentMethodColor(sale.paymentMethod)} text-white`}>
                            {getPaymentMethodLabel(sale.paymentMethod)}
                          </Badge>
                        </div>
                        {sale.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {sale.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Euro className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune vente supprimée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deleted Expenses */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Dépenses supprimées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : deletedExpenses.length > 0 ? (
                <div className="space-y-4">
                  {deletedExpenses.map((expense: any) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between py-3 border-b last:border-b-0 bg-gray-50 p-4 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {expense.description}
                            </p>
                            <p className="text-sm text-gray-500">
                              Supprimée le {format(new Date(expense.deletedAt), "dd/MM/yyyy HH:mm", { locale: fr })}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {expense.category}
                          </Badge>
                        </div>
                        <div className="mt-2">
                          <span className="text-lg font-bold text-red-600">
                            {formatCurrency(parseFloat(expense.amount))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune dépense supprimée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}