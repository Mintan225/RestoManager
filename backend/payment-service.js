var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { APP_CONFIG } from "@shared/config";
// Service de base pour les paiements
class BasePaymentService {
    constructor(config, baseUrl) {
        this.config = config;
        this.baseUrl = baseUrl;
    }
}
// Service Orange Money
class OrangeMoneyService extends BasePaymentService {
    initiatePayment(paymentConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.config.ENABLED || !this.config.API_KEY) {
                    throw new Error("Orange Money n'est pas configuré");
                }
                // Simulation pour le développement
                if (APP_CONFIG.APP.NODE_ENV === "development") {
                    return {
                        success: true,
                        transactionId: `OM_${Date.now()}`,
                        message: "Paiement Orange Money initié (mode développement)",
                        ussdCode: "#144*1*1#"
                    };
                }
                const response = yield fetch(`${this.baseUrl}/webpayment`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.config.API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        merchant_key: this.config.MERCHANT_ID,
                        currency: paymentConfig.currency || "XOF",
                        order_id: paymentConfig.orderId || `ORDER_${Date.now()}`,
                        amount: paymentConfig.amount,
                        return_url: `${APP_CONFIG.APP.BASE_URL}/payment/success`,
                        cancel_url: `${APP_CONFIG.APP.BASE_URL}/payment/cancel`,
                        notif_url: this.config.WEBHOOK_URL,
                        lang: "fr",
                        reference: `REF_${Date.now()}`
                    })
                });
                const data = yield response.json();
                if (data.status === "SUCCESS") {
                    return {
                        success: true,
                        transactionId: data.pay_token,
                        message: "Paiement Orange Money initié avec succès",
                        redirectUrl: data.payment_url
                    };
                }
                else {
                    throw new Error(data.message || "Erreur lors de l'initialisation du paiement");
                }
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : "Erreur Orange Money"
                };
            }
        });
    }
    checkPaymentStatus(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Implémentation du statut de paiement Orange Money
            return {
                transactionId,
                status: "pending",
                amount: 0,
                currency: "XOF",
                paymentMethod: "orange_money",
                createdAt: new Date()
            };
        });
    }
    processWebhook(data) {
        return __awaiter(this, void 0, void 0, function* () {
            // Traitement des webhooks Orange Money
            return { success: true, transactionId: data.pay_token };
        });
    }
}
// Service MTN Mobile Money
class MTNMomoService extends BasePaymentService {
    initiatePayment(paymentConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                if (!this.config.ENABLED || !this.config.SUBSCRIPTION_KEY) {
                    throw new Error("MTN MoMo n'est pas configuré");
                }
                // Simulation pour le développement
                if (APP_CONFIG.APP.NODE_ENV === "development") {
                    return {
                        success: true,
                        transactionId: `MTN_${Date.now()}`,
                        message: "Paiement MTN MoMo initié (mode développement)",
                        ussdCode: "*126#"
                    };
                }
                // Génération du token d'accès
                const tokenResponse = yield fetch(`${this.baseUrl}/collection/token/`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Basic ${Buffer.from(`${this.config.API_USER_ID}:${this.config.API_KEY}`).toString('base64')}`,
                        "Ocp-Apim-Subscription-Key": this.config.SUBSCRIPTION_KEY,
                        "X-Target-Environment": this.config.TARGET_ENVIRONMENT
                    }
                });
                const tokenData = yield tokenResponse.json();
                const accessToken = tokenData.access_token;
                // Initiation du paiement
                const paymentResponse = yield fetch(`${this.baseUrl}/collection/v1_0/requesttopay`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${accessToken}`,
                        "X-Reference-Id": `REF_${Date.now()}`,
                        "X-Target-Environment": this.config.TARGET_ENVIRONMENT,
                        "Ocp-Apim-Subscription-Key": this.config.SUBSCRIPTION_KEY,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        amount: paymentConfig.amount.toString(),
                        currency: paymentConfig.currency || "XOF",
                        externalId: paymentConfig.orderId || `ORDER_${Date.now()}`,
                        payer: {
                            partyIdType: "MSISDN",
                            partyId: ((_a = paymentConfig.customerPhone) === null || _a === void 0 ? void 0 : _a.replace(/\D/g, '')) || "22990000000"
                        },
                        payerMessage: paymentConfig.description || "Paiement restaurant",
                        payeeNote: `Commande ${paymentConfig.orderId}`
                    })
                });
                if (paymentResponse.ok) {
                    const referenceId = paymentResponse.headers.get("X-Reference-Id");
                    return {
                        success: true,
                        transactionId: referenceId || `MTN_${Date.now()}`,
                        message: "Paiement MTN MoMo initié avec succès"
                    };
                }
                else {
                    throw new Error("Erreur lors de l'initialisation du paiement MTN");
                }
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : "Erreur MTN MoMo"
                };
            }
        });
    }
    checkPaymentStatus(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                transactionId,
                status: "pending",
                amount: 0,
                currency: "XOF",
                paymentMethod: "mtn_momo",
                createdAt: new Date()
            };
        });
    }
    processWebhook(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return { success: true, transactionId: data.referenceId };
        });
    }
}
// Service Moov Money
class MoovMoneyService extends BasePaymentService {
    initiatePayment(paymentConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.config.ENABLED || !this.config.API_KEY) {
                    throw new Error("Moov Money n'est pas configuré");
                }
                // Simulation pour le développement
                if (APP_CONFIG.APP.NODE_ENV === "development") {
                    return {
                        success: true,
                        transactionId: `MOOV_${Date.now()}`,
                        message: "Paiement Moov Money initié (mode développement)",
                        ussdCode: "#155#"
                    };
                }
                // Implémentation réelle de l'API Moov Money
                const response = yield fetch(`${this.baseUrl}/payment/init`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.config.API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        merchantId: this.config.MERCHANT_ID,
                        amount: paymentConfig.amount,
                        currency: paymentConfig.currency || "XOF",
                        orderId: paymentConfig.orderId || `ORDER_${Date.now()}`,
                        customerPhone: paymentConfig.customerPhone,
                        description: paymentConfig.description || "Paiement restaurant"
                    })
                });
                const data = yield response.json();
                if (data.success) {
                    return {
                        success: true,
                        transactionId: data.transactionId,
                        message: "Paiement Moov Money initié avec succès",
                        ussdCode: data.ussdCode
                    };
                }
                else {
                    throw new Error(data.message || "Erreur lors de l'initialisation du paiement");
                }
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : "Erreur Moov Money"
                };
            }
        });
    }
    checkPaymentStatus(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                transactionId,
                status: "pending",
                amount: 0,
                currency: "XOF",
                paymentMethod: "moov_money",
                createdAt: new Date()
            };
        });
    }
    processWebhook(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return { success: true, transactionId: data.transactionId };
        });
    }
}
// Service Wave
class WaveService extends BasePaymentService {
    initiatePayment(paymentConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.config.ENABLED || !this.config.API_KEY) {
                    throw new Error("Wave n'est pas configuré");
                }
                // Simulation pour le développement
                if (APP_CONFIG.APP.NODE_ENV === "development") {
                    return {
                        success: true,
                        transactionId: `WAVE_${Date.now()}`,
                        message: "Paiement Wave initié (mode développement)",
                        qrCode: `data:image/svg+xml;base64,${Buffer.from('<svg>QR Code Wave</svg>').toString('base64')}`
                    };
                }
                // Implémentation réelle de l'API Wave
                const response = yield fetch(`${this.baseUrl}/v1/checkout/sessions`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${this.config.API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        amount: paymentConfig.amount * 100, // Wave utilise les centimes
                        currency: paymentConfig.currency || "XOF",
                        success_url: `${APP_CONFIG.APP.BASE_URL}/payment/success`,
                        cancel_url: `${APP_CONFIG.APP.BASE_URL}/payment/cancel`,
                        metadata: {
                            orderId: paymentConfig.orderId,
                            customerName: paymentConfig.customerName
                        }
                    })
                });
                const data = yield response.json();
                if (data.id) {
                    return {
                        success: true,
                        transactionId: data.id,
                        message: "Paiement Wave initié avec succès",
                        redirectUrl: data.wave_launch_url,
                        qrCode: data.qr_code
                    };
                }
                else {
                    throw new Error("Erreur lors de l'initialisation du paiement Wave");
                }
            }
            catch (error) {
                return {
                    success: false,
                    message: error instanceof Error ? error.message : "Erreur Wave"
                };
            }
        });
    }
    checkPaymentStatus(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                transactionId,
                status: "pending",
                amount: 0,
                currency: "XOF",
                paymentMethod: "wave",
                createdAt: new Date()
            };
        });
    }
    processWebhook(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return { success: true, transactionId: data.id };
        });
    }
}
// Factory pour créer les services de paiement
class PaymentServiceFactory {
    static getService(method) {
        switch (method) {
            case "orange_money":
                return this.orangeMoney;
            case "mtn_momo":
                return this.mtnMomo;
            case "moov_money":
                return this.moovMoney;
            case "wave":
                return this.wave;
            case "cash":
                return null; // Cash ne nécessite pas de service
            default:
                throw new Error(`Méthode de paiement non supportée: ${method}`);
        }
    }
}
PaymentServiceFactory.orangeMoney = new OrangeMoneyService({
    merchant_id: process.env.ORANGE_MONEY_MERCHANT_ID,
    api_key: process.env.ORANGE_MONEY_API_KEY,
    api_secret: process.env.ORANGE_MONEY_API_SECRET,
}, "https://api.orange.com/orange-money-webpay");
PaymentServiceFactory.mtnMomo = new MTNMomoService({
    api_user_id: process.env.MTN_MOMO_API_USER_ID,
    subscription_key: process.env.MTN_MOMO_SUBSCRIPTION_KEY,
    api_key: process.env.MTN_MOMO_API_KEY,
}, "https://sandbox.momodeveloper.mtn.com");
PaymentServiceFactory.moovMoney = new MoovMoneyService({
    merchant_id: process.env.MOOV_MONEY_MERCHANT_ID,
    api_key: process.env.MOOV_MONEY_API_KEY,
    api_secret: process.env.MOOV_MONEY_API_SECRET,
}, "https://api.moovmoney.com");
PaymentServiceFactory.wave = new WaveService({
    merchant_id: process.env.WAVE_MERCHANT_ID,
    api_key: process.env.WAVE_API_KEY,
    secret_key: process.env.WAVE_SECRET_KEY,
}, "https://api.wave.com/v1");
// Service principal de paiement
export class PaymentService {
    static initiatePayment(paymentConfig) {
        return __awaiter(this, void 0, void 0, function* () {
            if (paymentConfig.method === "cash") {
                return {
                    success: true,
                    message: "Paiement en espèces confirmé",
                    transactionId: `CASH_${Date.now()}`
                };
            }
            const service = PaymentServiceFactory.getService(paymentConfig.method);
            if (!service) {
                return {
                    success: false,
                    message: "Service de paiement non disponible"
                };
            }
            return yield service.initiatePayment(paymentConfig);
        });
    }
    static checkPaymentStatus(method, transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (method === "cash") {
                return {
                    transactionId,
                    status: "success",
                    amount: 0,
                    currency: "XOF",
                    paymentMethod: "cash",
                    createdAt: new Date(),
                    completedAt: new Date()
                };
            }
            const service = PaymentServiceFactory.getService(method);
            if (!service) {
                throw new Error("Service de paiement non disponible");
            }
            return yield service.checkPaymentStatus(transactionId);
        });
    }
    static processWebhook(method, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const service = PaymentServiceFactory.getService(method);
            if (!service) {
                return { success: false };
            }
            return yield service.processWebhook(data);
        });
    }
}
