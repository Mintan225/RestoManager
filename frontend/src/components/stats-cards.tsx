import { Card, CardContent } from "@/components/ui/card";
import { Banknote, ShoppingCart, Users, TrendingUp, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/currency";

interface StatsCardsProps {
  stats: {
    todaySales: number;
    activeOrders: number;
    occupiedTables: string;
    todayExpenses: number;
    todayProfit: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Ventes aujourd'hui",
      value: formatCurrency(stats.todaySales),
      icon: Banknote,
      bgColor: "bg-success",
    },
    {
      title: "Commandes actives",
      value: stats.activeOrders.toString(),
      icon: ShoppingCart,
      bgColor: "bg-primary",
    },
    {
      title: "Tables occupées",
      value: stats.occupiedTables,
      icon: Users,
      bgColor: "bg-warning",
    },
    {
      title: "Dépenses du jour",
      value: formatCurrency(stats.todayExpenses),
      icon: CreditCard,
      bgColor: "bg-destructive",
    },
    {
      title: "Bénéfice du jour",
      value: formatCurrency(stats.todayProfit),
      icon: TrendingUp,
      bgColor: "bg-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="overflow-hidden shadow-sm border">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${card.bgColor} rounded-md flex items-center justify-center`}>
                  <card.icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="ml-4 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </dt>
                  <dd className="text-2xl font-bold text-gray-900">
                    {card.value}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
