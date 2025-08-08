var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// customer-menu.tsx
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency";
import { OrderNotification, useOrderNotifications } from "@/components/order-notification";
import { OrderTracking } from "@/components/order-tracking";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Plus, Minus, UtensilsCrossed, Phone, User, CreditCard, Smartphone, CheckCircle, } from "lucide-react";
import { cn } from "@/lib/utils";
const BASE_BUTTON_CLASSES = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
const DEFAULT_BUTTON_CLASSES = "bg-primary text-primary-foreground hover:bg-primary/90";
const OUTLINE_BUTTON_CLASSES = "border border-input bg-background hover:bg-accent hover:text-accent-foreground";
export default function CustomerMenu() {
    const [, params] = useRoute("/menu/:tableNumber");
    const tableNumber = params === null || params === void 0 ? void 0 : params.tableNumber;
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [orderNotes, setOrderNotes] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [lastOrderId, setLastOrderId] = useState(null);
    const [showOrderTracking, setShowOrderTracking] = useState(false);
    const { toast } = useToast();
    const { notifications, removeNotification } = useOrderNotifications(parseInt(tableNumber || "0"), customerName, customerPhone);
    const { data: menuData, isLoading } = useQuery({
        queryKey: [`/api/menu/${tableNumber}`],
        enabled: !!tableNumber,
    });
    const orderMutation = useMutation({
        mutationFn: (orderData) => __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            });
            if (!response.ok) {
                const error = yield response.json();
                throw new Error(error.message || "Failed to create order");
            }
            return response.json();
        }),
        onSuccess: (data) => {
            setLastOrderId(data.id);
            setShowOrderTracking(true);
            toast({
                title: "Commande envoyée!",
                description: `Votre commande #${data.id} a été transmise. Suivez son évolution !`,
            });
            setShowCart(false);
            setTimeout(() => {
                setCart([]);
                setOrderNotes("");
            }, 1500);
        },
        onError: (error) => {
            toast({
                title: "Erreur",
                description: error.message,
                variant: "destructive",
            });
        },
    });
    // --- EARLY RETURNS POUR LES CAS D'ERREUR OU DE CHARGEMENT INITIAUX (CEUX-CI SONT CORRECTS) ---
    if (!tableNumber) {
        return (<div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Numéro de table manquant
            </h1>
            <p className="text-gray-600">
              Veuillez scanner le QR code de votre table.
            </p>
          </CardContent>
        </Card>
      </div>);
    }
    if (isLoading) {
        return (<div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <UtensilsCrossed className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse"/>
          <p className="text-gray-600">Chargement du menu...</p>
        </div>
      </div>);
    }
    if (!menuData) {
        return (<div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Table non trouvée
            </h1>
            <p className="text-gray-600">
              Cette table n'existe pas ou n'est pas disponible.
            </p>
          </CardContent>
        </Card>
      </div>);
    }
    const { table, categories, products } = menuData;
    const addToCart = (product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find((item) => item.id === product.id);
            if (existingItem) {
                return prevCart.map((item) => item.id === product.id
                    ? Object.assign(Object.assign({}, item), { quantity: item.quantity + 1 }) : item);
            }
            else {
                return [
                    ...prevCart,
                    {
                        id: product.id,
                        name: product.name,
                        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
                        quantity: 1,
                    },
                ];
            }
        });
    };
    const removeFromCart = (productId) => {
        setCart((prevCart) => {
            return prevCart
                .map((item) => item.id === productId
                ? Object.assign(Object.assign({}, item), { quantity: item.quantity - 1 }) : item)
                .filter((item) => item.quantity > 0);
        });
    };
    const updateCartItemNotes = (productId, notes) => {
        setCart((prevCart) => prevCart.map((item) => item.id === productId ? Object.assign(Object.assign({}, item), { notes }) : item));
    };
    const getTotalPrice = () => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    };
    const getTotalItems = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };
    const getCartItemQuantity = (productId) => {
        const item = cart.find((item) => item.id === productId);
        return item ? item.quantity : 0;
    };
    const filteredProducts = selectedCategory
        ? products.filter((product) => product.categoryId === selectedCategory)
        : products;
    const handleSubmitOrder = () => {
        if (cart.length === 0) {
            toast({
                title: "Panier vide",
                description: "Ajoutez des articles à votre panier avant de commander.",
                variant: "destructive",
            });
            return;
        }
        if (!customerName.trim()) {
            toast({
                title: "Nom requis",
                description: "Veuillez saisir votre nom.",
                variant: "destructive",
            });
            return;
        }
        const orderData = {
            tableId: table.id,
            customerName: customerName.trim(),
            customerPhone: customerPhone.trim() || null,
            paymentMethod,
            notes: orderNotes.trim() || null,
            orderItems: cart.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.price.toString(),
                notes: item.notes || null,
            })),
        };
        orderMutation.mutate(orderData);
    };
    // --- DÉBUT DE L'ARBRE DE RENDU UNIQUE ---
    return (<div className="min-h-screen bg-gray-50">
      {/* Composant de suivi des commandes - Reste toujours monté */}
      {showOrderTracking && (<OrderTracking tableId={parseInt(tableNumber)} customerName={customerName} customerPhone={customerPhone} onClose={() => setShowOrderTracking(false)}/>)}

      {/* Notifications - Restent toujours montées */}
      {notifications.map((notification) => {
            var _a;
            return (<OrderNotification key={(_a = notification.notificationId) !== null && _a !== void 0 ? _a : notification.id} order={notification} onClose={() => removeNotification(notification.notificationId)}/>);
        })}
      
      {/* Utilisation de l'opérateur ternaire pour basculer entre le panier et le menu */}
      {showCart ? (
        // --- CONTENU DU PANIER ---
        <div className="min-h-screen bg-gray-50">
          {/* Header du panier */}
          <div className="bg-white shadow-sm border-b">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setShowCart(false)} className={cn(BASE_BUTTON_CLASSES, OUTLINE_BUTTON_CLASSES)}>
                  ← Retour au menu
                </button>
                <div className="text-center">
                  <h1 className="text-lg font-bold">Votre commande</h1>
                  <p className="text-sm text-gray-600">Table {table.number}</p>
                </div>
                <div className="w-20"></div>
              </div>
            </div>
          </div>

          <div className="p-4 max-w-2xl mx-auto space-y-6">
            {/* Cart Items */}
            <Card>
              <CardHeader>
                <CardTitle>Articles commandés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <>
                  {cart.map((item) => {
                var _a, _b, _c;
                return (<div key={item.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                      <div className="flex-1">
                        <h3 className="font-medium">{(_a = item.name) !== null && _a !== void 0 ? _a : 'Article inconnu'}</h3>
                        <p className="text-sm text-gray-600">
                          {((_b = formatCurrency(item.price)) !== null && _b !== void 0 ? _b : '0.00 XOF')} × {(_c = item.quantity) !== null && _c !== void 0 ? _c : 0}
                        </p>
                        <div className="mt-2">
                          <textarea placeholder="Notes spéciales (optionnel)" value={item.notes || ""} onChange={(e) => updateCartItemNotes(item.id, e.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-sm"/>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button type="button" onClick={() => removeFromCart(item.id)} className={cn(BASE_BUTTON_CLASSES, OUTLINE_BUTTON_CLASSES, "h-8 w-8 p-0")}>
                          <Minus className="h-4 w-4"/>
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button type="button" onClick={() => addToCart({ id: item.id, name: item.name, price: item.price })} className={cn(BASE_BUTTON_CLASSES, OUTLINE_BUTTON_CLASSES, "h-8 w-8 p-0")}>
                          <Plus className="h-4 w-4"/>
                        </button>
                      </div>
                    </div>);
            })}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatCurrency(getTotalPrice())}</span>
                    </div>
                  </div>
                </>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Vos informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">
                    <User className="h-4 w-4 inline mr-2"/>
                    Nom *
                  </Label>
                  <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Votre nom" required/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">
                    <Phone className="h-4 w-4 inline mr-2"/>
                    Téléphone (optionnel)
                  </Label>
                  <Input id="customerPhone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Votre numéro de téléphone"/>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orderNotes">Notes pour la commande</Label>
                  <Textarea id="orderNotes" value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Instructions spéciales, allergies, etc."/>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Méthode de paiement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Cash Payment */}
                  <button type="button" onClick={() => setPaymentMethod("cash")} className={cn(BASE_BUTTON_CLASSES, paymentMethod === "cash" ? DEFAULT_BUTTON_CLASSES : OUTLINE_BUTTON_CLASSES, "w-full h-16 flex items-center justify-start px-6")}>
                    <CreditCard className="h-6 w-6 mr-4"/>
                    <span className="text-lg">Paiement en espèces</span>
                  </button>
                  
                  {/* Mobile Money Options */}
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Mobile Money</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setPaymentMethod("orange_money")} className={cn(BASE_BUTTON_CLASSES, paymentMethod === "orange_money" ? DEFAULT_BUTTON_CLASSES : OUTLINE_BUTTON_CLASSES, "h-14 flex-col")}>
                        <Smartphone className="h-5 w-5 mb-1"/>
                        <span className="text-sm">Orange Money</span>
                      </button>
                      <button type="button" onClick={() => setPaymentMethod("mtn_momo")} className={cn(BASE_BUTTON_CLASSES, paymentMethod === "mtn_momo" ? DEFAULT_BUTTON_CLASSES : OUTLINE_BUTTON_CLASSES, "h-14 flex-col")}>
                        <Smartphone className="h-5 w-5 mb-1"/>
                        <span className="text-sm">MTN MoMo</span>
                      </button>
                      <button type="button" onClick={() => setPaymentMethod("moov_money")} className={cn(BASE_BUTTON_CLASSES, paymentMethod === "moov_money" ? DEFAULT_BUTTON_CLASSES : OUTLINE_BUTTON_CLASSES, "h-14 flex-col")}>
                        <Smartphone className="h-5 w-5 mb-1"/>
                        <span className="text-sm">Moov Money</span>
                      </button>
                      <button type="button" onClick={() => setPaymentMethod("wave")} className={cn(BASE_BUTTON_CLASSES, paymentMethod === "wave" ? DEFAULT_BUTTON_CLASSES : OUTLINE_BUTTON_CLASSES, "h-14 flex-col")}>
                        <Smartphone className="h-5 w-5 mb-1"/>
                        <span className="text-sm">Wave</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Payment Info */}
                {paymentMethod === "cash" && (<p className="text-sm text-gray-600 mt-4">
                    Vous paierez en espèces à la livraison de votre commande.
                  </p>)}
                {paymentMethod !== "cash" && paymentMethod !== "mobile_money" && (<p className="text-sm text-gray-600 mt-4">
                    Le paiement sera traité via {paymentMethod === "orange_money" ? "Orange Money" :
                    paymentMethod === "mtn_momo" ? "MTN Mobile Money" :
                        paymentMethod === "moov_money" ? "Moov Money" :
                            paymentMethod === "wave" ? "Wave" : "Mobile Money"}.
                  </p>)}
              </CardContent>
            </Card>

            {/* Submit Order */}
            <button type="button" onClick={handleSubmitOrder} disabled={orderMutation.isPending || cart.length === 0} className={cn(BASE_BUTTON_CLASSES, DEFAULT_BUTTON_CLASSES, "w-full h-12 text-lg")}>
              {orderMutation.isPending ? ("Envoi en cours...") : (<>
                  <CheckCircle className="h-5 w-5 mr-2"/>
                  Confirmer la commande ({formatCurrency(getTotalPrice())})
                </>)}
            </button>
          </div>
        </div>) : (
        // --- CONTENU DU MENU PRINCIPAL ---
        <div className="min-h-screen bg-gray-50">
          {/* Header du menu */}
          <div className="bg-white shadow-sm border-b sticky top-0 z-10">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                    <UtensilsCrossed className="h-4 w-4 text-white"/>
                  </div>
                  <div>
                    <h1 className="text-lg font-bold">Notre Menu</h1>
                    <p className="text-sm text-gray-600">Table {table.number}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {lastOrderId && customerName && (<Button variant="outline" size="sm" onClick={() => setShowOrderTracking(true)} className="bg-blue-50 text-blue-600 border-blue-200">
                      📋 Suivi
                    </Button>)}
                  <Button onClick={() => setShowCart(true)} className="relative" disabled={cart.length === 0}>
                    <ShoppingCart className="h-4 w-4 mr-2"/>
                    Panier
                    {getTotalItems() > 0 && (<Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-white text-xs">
                        {getTotalItems()}
                      </Badge>)}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 max-w-4xl mx-auto">
            {/* Categories */}
            {categories.length > 0 && (<div className="mb-6">
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  <Button variant={selectedCategory === null ? "default" : "outline"} onClick={() => setSelectedCategory(null)} className="whitespace-nowrap">
                    Tout voir
                  </Button>
                  {categories.map((category) => (<Button key={category.id} variant={selectedCategory === category.id ? "default" : "outline"} onClick={() => setSelectedCategory(category.id)} className="whitespace-nowrap">
                      {category.name}
                    </Button>))}
                </div>
              </div>)}

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => {
                const currentQuantity = getCartItemQuantity(product.id);
                return (<Card key={product.id} className="overflow-hidden">
                    {product.imageUrl && (<div className="h-48 bg-gray-100">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={(e) => {
                            e.target.style.display = 'none';
                        }}/>
                      </div>)}
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{product.name}</h3>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(product.price)}
                        </span>
                      </div>
                      {product.description && (<p className="text-gray-600 text-sm mb-4">
                          {product.description}
                        </p>)}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button type="button" onClick={() => removeFromCart(product.id)} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground", "h-8 w-8 p-0", currentQuantity === 0 ? "hidden" : "")}>
                            <Minus className="h-4 w-4"/>
                          </button>
                          <span className={cn("w-8 text-center", currentQuantity === 0 ? "hidden" : "")}>
                            {currentQuantity}
                          </span>
                          <button type="button" onClick={() => addToCart(product)} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90", "flex-shrink-0", currentQuantity > 0 ? "hidden" : "")}>
                            <Plus className="h-4 w-4 mr-1"/>
                            Ajouter
                          </button>
                          <button type="button" onClick={() => addToCart(product)} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground", "h-8 w-8 p-0", currentQuantity === 0 ? "hidden" : "")}>
                            <Plus className="h-4 w-4"/>
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>);
            })}
            </div>

            {filteredProducts.length === 0 && (<div className="text-center py-12">
                <UtensilsCrossed className="h-12 w-12 text-gray-400 mx-auto mb-4"/>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun produit disponible
                </h3>
                <p className="text-gray-500">
                  {selectedCategory
                    ? "Aucun produit dans cette catégorie."
                    : "Le menu n'est pas encore disponible."}
                </p>
              </div>)}
          </div>

          {/* Fixed Cart Button for Mobile */}
          {cart.length > 0 && (<div className="fixed bottom-4 right-4 md:hidden">
              <Button onClick={() => setShowCart(true)} className="relative h-12 w-12 rounded-full shadow-lg">
                <ShoppingCart className="h-5 w-5"/>
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-destructive text-white text-xs">
                  {getTotalItems()}
                </Badge>
              </Button>
            </div>)}
        </div>)}
    </div>);
}
