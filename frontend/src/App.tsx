import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import  authService  from "@/lib/auth";
import { useEffect, useState } from "react";

// Import pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Products from "@/pages/products";
import Orders from "@/pages/orders";
import QRCodes from "@/pages/qr-codes";
import Sales from "@/pages/sales";
import Expenses from "@/pages/expenses";
import Settings from "@/pages/settings";
import Archives from "@/pages/archives";
import CustomerMenu from "@/pages/customer-menu";
import Config from "@/pages/config";
import Users from "@/pages/users";
import NotificationDemo from "@/pages/notification-demo";
import NotFound from "@/pages/not-found";
import SuperAdminLogin from "@/pages/super-admin-login";
import SuperAdminDashboard from "@/pages/super-admin-dashboard";
import SuperAdminDataManagement from "@/pages/super-admin-data-management";
import SystemConfig from "@/pages/system-config";
import ErrorBoundary from "@/components/ErrorBoundary"; // Importez ErrorBoundary

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated());
    };

    checkAuth();
    
    // Check auth status every time localStorage changes
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-primary rounded-lg mx-auto mb-4 animate-pulse"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden md:flex md:w-64 md:flex-col">
        <Sidebar />
      </div>
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <button className="md:hidden -ml-2 mr-2 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary">
                <i className="fas fa-bars"></i>
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = authService.isAuthenticated();
  
  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login">
        <PublicRoute>
          <Login />
        </PublicRoute>
      </Route>
      
      {/* Customer menu routes (public, no auth required) */}
      <Route path="/menu/:tableNumber">
        {/* ENVELOPPEZ CUSTOMERMENU AVEC ERRORBOUNDARY ICI */}
        <ErrorBoundary>
          <CustomerMenu />
        </ErrorBoundary>
      </Route>
      
      {/* QR Code route - redirects to menu */}
      <Route path="/table/:tableNumber">
        {(params) => <Redirect to={`/menu/${params.tableNumber}`} />}
      </Route>

      {/* Super Admin routes (separate system) */}
      <Route path="/super-admin">
        <Redirect to="/super-admin/login" />
      </Route>
      
      <Route path="/super-admin/login">
        <SuperAdminLogin />
      </Route>
      
      <Route path="/super-admin/dashboard">
        <SuperAdminDashboard />
      </Route>
      
      <Route path="/super-admin/data-management">
        <SuperAdminDataManagement />
      </Route>
      
      <Route path="/super-admin/system-config">
        <SystemConfig />
      </Route>

      {/* Protected admin routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/products">
        <ProtectedRoute>
          <Products />
        </ProtectedRoute>
      </Route>
      
      <Route path="/orders">
        <ProtectedRoute>
          <Orders />
        </ProtectedRoute>
      </Route>
      
      <Route path="/qr-codes">
        <ProtectedRoute>
          <QRCodes />
        </ProtectedRoute>
      </Route>
      
      <Route path="/sales">
        <ProtectedRoute>
          <Sales />
        </ProtectedRoute>
      </Route>
      
      <Route path="/expenses">
        <ProtectedRoute>
          <Expenses />
        </ProtectedRoute>
      </Route>
      
      <Route path="/archives">
        <ProtectedRoute>
          <Archives />
        </ProtectedRoute>
      </Route>
      
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>

      <Route path="/config">
        <ProtectedRoute>
          <Config />
        </ProtectedRoute>
      </Route>
      
      <Route path="/users">
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      </Route>

      {/* Redirect root to dashboard if authenticated, otherwise to login */}
      <Route path="/notification-demo">
        <NotificationDemo />
      </Route>

      <Route path="/">
        {authService.isAuthenticated() ? (
          <Redirect to="/dashboard" />
        ) : (
          <Redirect to="/login" />
        )}
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
