import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Settings, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Globe, 
  Phone, 
  Mail, 
  MapPin,
  Check,
  X,
  TestTube
} from "lucide-react";
// Importation du service d'authentification manquant
import authService from "@/lib/auth"; 

interface ConfigData {
  restaurant: {
    NAME: string;
    ADDRESS: string;
    PHONE: string;
    EMAIL: string;
    WEBSITE: string;
  };
  paymentMethods: Array<{
    id: string;
    label: string;
    enabled: boolean;
  }>;
  business: {
    TAX_RATE: number;
    SERVICE_CHARGE: number;
    DELIVERY_FEE: number;
    MINIMUM_ORDER: number;
  };
  app: {
    name: string;
    version: string;
    environment: string;
  };
}

export default function Config() {
  const [testingPayment, setTestingPayment] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: config, isLoading } = useQuery<ConfigData>({
    queryKey: ["/api/config"],
    queryFn: async () => {
      // AJOUT DES EN-TÊTES D'AUTHENTIFICATION ICI
      const response = await fetch("/api/config", {
        headers: authService.getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to fetch configuration");
      }
      return response.json();
    },
  });

  const testPaymentMethod = async (method: string) => {
    setTestingPayment(method);
    try {
      const response = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authService.getAuthHeaders(), // AJOUT DES EN-TÊTES D'AUTHENTIFICATION ICI AUSSI
        },
        body: JSON.stringify({
          method: method,
          amount: 1000,
          currency: "FCFA",
          description: "Test de paiement",
          orderId: `TEST_${Date.now()}`,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Test réussi",
          description: `${method} fonctionne correctement`,
        });
      } else {
        toast({
          title: "Test échoué",
          description: result.message || "Erreur lors du test",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de test",
        description: "Impossible de tester le paiement",
        variant: "destructive",
      });
    } finally {
      setTestingPayment(null);
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <CreditCard className="h-4 w-4" />;
      case "orange_money":
      case "mtn_momo":
      case "moov_money":
      case "wave":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getPaymentColor = (method: string) => {
    switch (method) {
      case "orange_money":
        return "bg-orange-500";
      case "mtn_momo":
        return "bg-yellow-500";
      case "moov_money":
        return "bg-blue-500";
      case "wave":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Configuration du Système</h1>
      </div>

      {/* Informations du restaurant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informations du Restaurant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nom du restaurant</label>
              <p className="text-sm bg-gray-50 p-2 rounded">{config?.restaurant.NAME}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Adresse
              </label>
              <p className="text-sm bg-gray-50 p-2 rounded">{config?.restaurant.ADDRESS}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Phone className="h-4 w-4" />
                Téléphone
              </label>
              <p className="text-sm bg-gray-50 p-2 rounded">{config?.restaurant.PHONE}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <p className="text-sm bg-gray-50 p-2 rounded">{config?.restaurant.EMAIL}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Site web
              </label>
              <p className="text-sm bg-gray-50 p-2 rounded">{config?.restaurant.WEBSITE}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Méthodes de paiement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Méthodes de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {config?.paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${getPaymentColor(method.id)}`}>
                    {getPaymentIcon(method.id)}
                  </div>
                  <div>
                    <h3 className="font-medium">{method.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {method.id === "cash" ? "Paiement en espèces" : "Paiement mobile"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={method.enabled ? "default" : "secondary"}>
                    {method.enabled ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    {method.enabled ? "Activé" : "Désactivé"}
                  </Badge>
                  {method.enabled && method.id !== "cash" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testPaymentMethod(method.id)}
                      disabled={testingPayment === method.id}
                    >
                      <TestTube className="h-3 w-3 mr-1" />
                      {testingPayment === method.id ? "Test..." : "Tester"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Configuration business */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Business</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Taux de TVA</label>
              <p className="text-sm bg-gray-50 p-2 rounded">{config?.business.TAX_RATE}%</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Frais de service</label>
              <p className="text-sm bg-gray-50 p-2 rounded">{config?.business.SERVICE_CHARGE}%</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Frais de livraison</label>
              <p className="text-sm bg-gray-50 p-2 rounded">{config?.business.DELIVERY_FEE} FCFA</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Commande minimum</label>
              <p className="text-sm bg-gray-50 p-2 rounded">{config?.business.MINIMUM_ORDER} FCFA</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations système */}
      <Card>
        <CardHeader>
          <CardTitle>Informations Système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Application</label>
              <p className="text-sm bg-gray-50 p-2 rounded">{config?.app.name}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Version</label>
              <p className="text-sm bg-gray-50 p-2 rounded">{config?.app.version}</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Environnement</label>
              <Badge variant={config?.app.environment === "production" ? "default" : "secondary"}>
                {config?.app.environment}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions de configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions de Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Configuration des variables d'environnement</h4>
            <p className="text-sm text-gray-600 mb-2">
              Pour configurer les paiements Mobile Money, vous devez définir les variables d'environnement suivantes :
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <code className="bg-gray-100 px-1 rounded">ORANGE_MONEY_API_KEY</code> - Clé API Orange Money</li>
              <li>• <code className="bg-gray-100 px-1 rounded">MTN_MOMO_SUBSCRIPTION_KEY</code> - Clé d'abonnement MTN MoMo</li>
              <li>• <code className="bg-gray-100 px-1 rounded">MOOV_MONEY_API_KEY</code> - Clé API Moov Money</li>
              <li>• <code className="bg-gray-100 px-1 rounded">WAVE_API_KEY</code> - Clé API Wave</li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Mode développement</h4>
            <p className="text-sm text-gray-600">
              En mode développement, les paiements Mobile Money sont simulés. 
              Les vrais paiements nécessitent les clés API officielles et le mode production.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
