export const APP_CONFIG = {
  RESTAURANT: {
    NAME: "Restaurant Le Délice",
    ADDRESS: "123 Rue des Saveurs, Dakar",
    PHONE: "+221 33 123 45 67",
    EMAIL: "contact@restaurant-delice.com"
  },
  PAYMENT: {
    ENABLED_METHODS: ["cash", "orange_money", "mtn_momo", "moov_money", "wave"] as const,
    CURRENCY: "FCFA",
    CURRENCY_SYMBOL: "FCFA"
  },
  SECURITY: {
    JWT_SECRET: process.env.JWT_SECRET || "default-jwt-secret-for-development-only",
    JWT_EXPIRES_IN: "24h",
    SUPER_ADMIN_JWT_SECRET: process.env.SUPER_ADMIN_JWT_SECRET || "super-admin-jwt-secret-for-development-only"
  }
};

export type PaymentMethod = "cash" | "orange_money" | "mtn_momo" | "moov_money" | "wave";

export interface PaymentConfig {
  method: PaymentMethod;
  amount: number;
  currency?: string;
  description?: string;
  customerPhone?: string;
  customerName?: string;
  orderId?: string;
}

export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validation du nom du restaurant
  if (!APP_CONFIG.RESTAURANT.NAME) {
    errors.push("Le nom du restaurant est requis");
  }
  
  // Validation de l'adresse
  if (!APP_CONFIG.RESTAURANT.ADDRESS) {
    errors.push("L'adresse du restaurant est requise");
  }
  
  // Validation du téléphone
  if (!APP_CONFIG.RESTAURANT.PHONE) {
    errors.push("Le numéro de téléphone est requis");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function getAvailablePaymentMethods(): PaymentMethod[] {
  return APP_CONFIG.PAYMENT.ENABLED_METHODS.slice();
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    cash: "Espèces",
    orange_money: "Orange Money",
    mtn_momo: "MTN Mobile Money",
    moov_money: "Moov Money",
    wave: "Wave"
  };
  
  return labels[method] || method;
}

export function isPaymentMethodEnabled(method: PaymentMethod): boolean {
  return APP_CONFIG.PAYMENT.ENABLED_METHODS.includes(method);
}

// Function to get system app name from settings or fallback to default
export async function getSystemAppName(): Promise<string> {
  try {
    // This would be called from the frontend with proper authentication
    const response = await fetch("/api/super-admin/system-settings/app_name");
    if (response.ok) {
      const setting = await response.json();
      return setting.value || APP_CONFIG.RESTAURANT.NAME;
    }
  } catch (error) {
    console.warn("Could not fetch system app name:", error);
  }
  
  return APP_CONFIG.RESTAURANT.NAME;
}