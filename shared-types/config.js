var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const APP_CONFIG = {
    RESTAURANT: {
        NAME: "Restaurant Le Délice",
        ADDRESS: "123 Rue des Saveurs, Dakar",
        PHONE: "+221 33 123 45 67",
        EMAIL: "contact@restaurant-delice.com"
    },
    PAYMENT: {
        ENABLED_METHODS: ["cash", "orange_money", "mtn_momo", "moov_money", "wave"],
        CURRENCY: "FCFA",
        CURRENCY_SYMBOL: "FCFA"
    },
    SECURITY: {
        JWT_SECRET: process.env.JWT_SECRET || "default-jwt-secret-for-development-only",
        JWT_EXPIRES_IN: "24h",
        SUPER_ADMIN_JWT_SECRET: process.env.SUPER_ADMIN_JWT_SECRET || "super-admin-jwt-secret-for-development-only"
    }
};
export function validateConfig() {
    const errors = [];
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
export function getAvailablePaymentMethods() {
    return APP_CONFIG.PAYMENT.ENABLED_METHODS.slice();
}
export function getPaymentMethodLabel(method) {
    const labels = {
        cash: "Espèces",
        orange_money: "Orange Money",
        mtn_momo: "MTN Mobile Money",
        moov_money: "Moov Money",
        wave: "Wave"
    };
    return labels[method] || method;
}
export function isPaymentMethodEnabled(method) {
    return APP_CONFIG.PAYMENT.ENABLED_METHODS.includes(method);
}
// Function to get system app name from settings or fallback to default
export function getSystemAppName() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // This would be called from the frontend with proper authentication
            const response = yield fetch("/api/super-admin/system-settings/app_name");
            if (response.ok) {
                const setting = yield response.json();
                return setting.value || APP_CONFIG.RESTAURANT.NAME;
            }
        }
        catch (error) {
            console.warn("Could not fetch system app name:", error);
        }
        return APP_CONFIG.RESTAURANT.NAME;
    });
}
