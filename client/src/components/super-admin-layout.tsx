import { Button } from "@/components/ui/button";
import { Shield, ArrowLeft, Home, Database, Settings } from "lucide-react";
import { useLocation } from "wouter";

interface SuperAdminLayoutProps {
  children: React.ReactNode;
  title: string;
  showBackButton?: boolean;
}

export default function SuperAdminLayout({ children, title, showBackButton = false }: SuperAdminLayoutProps) {
  const [location, setLocation] = useLocation();

  const navigationItems = [
    { path: "/super-admin/dashboard", label: "Tableau de bord", icon: Home },
    { path: "/super-admin/data-management", label: "Gestion des données", icon: Database },
    { path: "/super-admin/system-config", label: "Configuration", icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem("superAdminToken");
    toast({
      title: "Déconnexion",
      description: "Vous avez été déconnecté avec succès",
    });
    setTimeout(() => {
      setLocation("/super-admin/login");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-red-50">
      {/* Header avec navigation */}
      <div className="bg-white shadow-sm border-b border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-xl font-bold text-red-800">Super Administrateur</h1>
                <p className="text-sm text-gray-600">{title}</p>
              </div>
              
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/super-admin/dashboard")}
                  className="ml-4 text-red-600 hover:bg-red-50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              Déconnexion
            </Button>
          </div>
          
          {/* Navigation horizontale */}
          <div className="border-t border-red-100 pt-2 pb-2">
            <nav className="flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="sm"
                    onClick={() => setLocation(item.path)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${
                      isActive
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}