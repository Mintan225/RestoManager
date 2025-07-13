import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import  authService  from "@/lib/auth";
import { useNewOrdersCount } from "@/hooks/useNewOrdersCount";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  QrCode,
  TrendingUp,
  Receipt,
  Settings,
  LogOut,
  UtensilsCrossed,
  Archive,
  Users,
} from "lucide-react";

const navigation = [
  {
    name: "Tableau de bord",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Produits",
    href: "/products",
    icon: Package,
  },
  {
    name: "Commandes",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    name: "QR Codes Tables",
    href: "/qr-codes",
    icon: QrCode,
  },
  {
    name: "Ventes",
    href: "/sales",
    icon: TrendingUp,
  },
  {
    name: "Dépenses",
    href: "/expenses",
    icon: Receipt,
  },
  {
    name: "Archives",
    href: "/archives",
    icon: Archive,
  },
  {
    name: "Utilisateurs",
    href: "/users",
    icon: Users,
  },
  {
    name: "Paramètres",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Configuration",
    href: "/config",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const user = authService.getUser();
  const { newOrdersCount, markAsViewed } = useNewOrdersCount();

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  const handleOrdersClick = () => {
    // Marquer les nouvelles commandes comme vues quand on clique sur l'onglet
    if (newOrdersCount > 0) {
      markAsViewed();
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-white border-r", className)}>
      {/* Logo */}
      <div className="flex items-center px-4 py-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="h-4 w-4 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-xl font-bold text-gray-900">RestoManager</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 mt-8 space-y-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          const isOrdersTab = item.href === "/orders";
          
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={isOrdersTab ? handleOrdersClick : undefined}
              className={cn(
                "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors relative",
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-white" : "text-gray-400"
                )}
              />
              {item.name}
              
              {/* Bulle de notification pour les nouvelles commandes */}
              {isOrdersTab && newOrdersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                  {newOrdersCount > 9 ? '9+' : newOrdersCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex items-center w-full">
          <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-700">{user?.username}</p>
            <p className="text-xs text-gray-500">Gérant</p>
          </div>
          <button
            onClick={handleLogout}
            className="ml-2 p-1 text-gray-400 hover:text-gray-600"
            title="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
