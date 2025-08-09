var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { users, categories, products, tables, orders, orderItems, sales, expenses, superAdmins, systemTabs, systemUpdates, systemSettings } from "@shared/schema";
import { DEFAULT_PERMISSIONS } from "@shared/permissions";
import { db } from "./db";
import { eq, desc, and, gte, lte, sum, ne, isNull, isNotNull, asc } from "drizzle-orm";
import bcrypt from "bcrypt";
export class DatabaseStorage {
    // Users
    getUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [user] = yield db.select().from(users).where(eq(users.id, id));
            return user || undefined;
        });
    }
    getUserByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.select({
                id: users.id,
                username: users.username,
                password: users.password,
                fullName: users.fullName,
                email: users.email,
                phone: users.phone,
                role: users.role,
                permissions: users.permissions,
                isActive: users.isActive,
                createdAt: users.createdAt,
                createdBy: users.createdBy,
            })
                .from(users)
                .where(eq(users.username, username))
                .limit(1);
            return result[0] || undefined;
        });
    }
    getUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(users).where(eq(users.isActive, true));
        });
    }
    createUser(insertUser) {
        return __awaiter(this, void 0, void 0, function* () {
            const [user] = yield db.insert(users).values(insertUser).returning();
            return user;
        });
    }
    updateUser(id, userData) {
        return __awaiter(this, void 0, void 0, function* () {
            const updateData = Object.fromEntries(Object.entries(userData).filter(([_, value]) => value !== undefined));
            const [updated] = yield db.update(users)
                .set(updateData)
                .where(eq(users.id, id))
                .returning();
            return updated || undefined;
        });
    }
    deleteUser(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield db.update(users)
                .set({ isActive: false })
                .where(eq(users.id, id));
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        });
    }
    // Categories
    getCategories() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(categories).orderBy(categories.name);
        });
    }
    createCategory(category) {
        return __awaiter(this, void 0, void 0, function* () {
            const [newCategory] = yield db.insert(categories).values(category).returning();
            return newCategory;
        });
    }
    updateCategory(id, category) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updated] = yield db.update(categories)
                .set(category)
                .where(eq(categories.id, id))
                .returning();
            return updated || undefined;
        });
    }
    deleteCategory(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield db.delete(categories).where(eq(categories.id, id));
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        });
    }
    // Products
    getProducts() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(products)
                .where(eq(products.archived, false))
                .orderBy(products.name);
        });
    }
    getProductsByCategory(categoryId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(products)
                .where(eq(products.categoryId, categoryId))
                .orderBy(products.name);
        });
    }
    getProduct(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [product] = yield db.select().from(products).where(eq(products.id, id));
            return product || undefined;
        });
    }
    createProduct(product) {
        return __awaiter(this, void 0, void 0, function* () {
            const [newProduct] = yield db.insert(products).values(product).returning();
            return newProduct;
        });
    }
    updateProduct(id, product) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updated] = yield db.update(products)
                .set(product)
                .where(eq(products.id, id))
                .returning();
            return updated || undefined;
        });
    }
    deleteProduct(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // First check if the product exists
                const [product] = yield db.select().from(products).where(eq(products.id, id));
                if (!product) {
                    return false;
                }
                // Check if product is used in any order items
                const [orderItem] = yield db.select().from(orderItems).where(eq(orderItems.productId, id));
                if (orderItem) {
                    // Instead of deleting, archive the product
                    const [archived] = yield db.update(products)
                        .set({ archived: true, available: false })
                        .where(eq(products.id, id))
                        .returning();
                    return !!archived;
                }
                // If not used in orders, delete permanently
                const result = yield db.delete(products).where(eq(products.id, id));
                return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
            }
            catch (error) {
                console.error("Error deleting product:", error);
                throw error;
            }
        });
    }
    // Tables
    getTables() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(tables).orderBy(tables.number);
        });
    }
    getTable(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [table] = yield db.select().from(tables).where(eq(tables.id, id));
            return table || undefined;
        });
    }
    getTableByNumber(number) {
        return __awaiter(this, void 0, void 0, function* () {
            const [table] = yield db.select().from(tables).where(eq(tables.number, number));
            return table || undefined;
        });
    }
    createTable(table) {
        return __awaiter(this, void 0, void 0, function* () {
            const [newTable] = yield db.insert(tables).values(table).returning();
            return newTable;
        });
    }
    updateTable(id, table) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updated] = yield db.update(tables)
                .set(table)
                .where(eq(tables.id, id))
                .returning();
            return updated || undefined;
        });
    }
    deleteTable(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield db.delete(tables).where(eq(tables.id, id));
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        });
    }
    // Orders
    getOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            const ordersData = yield db.select().from(orders)
                .where(isNull(orders.deletedAt))
                .orderBy(desc(orders.createdAt));
            const ordersWithItems = yield Promise.all(ordersData.map((order) => __awaiter(this, void 0, void 0, function* () {
                const items = yield this.getOrderItems(order.id);
                return Object.assign(Object.assign({}, order), { orderItems: items });
            })));
            return ordersWithItems;
        });
    }
    getDeletedOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            const ordersData = yield db.select().from(orders)
                .where(isNotNull(orders.deletedAt))
                .orderBy(desc(orders.deletedAt));
            const ordersWithItems = yield Promise.all(ordersData.map((order) => __awaiter(this, void 0, void 0, function* () {
                const items = yield this.getOrderItems(order.id);
                return Object.assign(Object.assign({}, order), { orderItems: items });
            })));
            return ordersWithItems;
        });
    }
    getActiveOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            const activeOrdersData = yield db.select().from(orders)
                .where(and(ne(orders.status, 'completed'), ne(orders.status, 'cancelled')))
                .orderBy(desc(orders.createdAt));
            const ordersWithItems = yield Promise.all(activeOrdersData.map((order) => __awaiter(this, void 0, void 0, function* () {
                const items = yield this.getOrderItems(order.id);
                return Object.assign(Object.assign({}, order), { orderItems: items });
            })));
            return ordersWithItems;
        });
    }
    getOrder(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [order] = yield db.select().from(orders).where(eq(orders.id, id));
            return order || undefined;
        });
    }
    getOrderWithItems(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.getOrder(id);
            if (!order)
                return undefined;
            const items = yield this.getOrderItems(id);
            return Object.assign(Object.assign({}, order), { orderItems: items });
        });
    }
    createOrder(order) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure total is provided
            const orderWithTotal = Object.assign(Object.assign({}, order), { total: order.total || "0.00" });
            const [newOrder] = yield db.insert(orders).values(orderWithTotal).returning();
            return newOrder;
        });
    }
    updateOrder(id, order) {
        return __awaiter(this, void 0, void 0, function* () {
            // Ensure total is provided for updates, filtering out undefined values
            const updateData = Object.fromEntries(Object.entries(order).filter(([_, value]) => value !== undefined));
            const [updated] = yield db.update(orders)
                .set(updateData)
                .where(eq(orders.id, id))
                .returning();
            return updated || undefined;
        });
    }
    deleteOrder(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield db.update(orders)
                .set({ deletedAt: new Date() })
                .where(eq(orders.id, id));
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        });
    }
    // Order Items
    getOrderItems(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db
                .select({
                id: orderItems.id,
                orderId: orderItems.orderId,
                productId: orderItems.productId,
                quantity: orderItems.quantity,
                price: orderItems.price,
                notes: orderItems.notes,
                product: products,
            })
                .from(orderItems)
                .innerJoin(products, eq(orderItems.productId, products.id))
                .where(eq(orderItems.orderId, orderId));
        });
    }
    createOrderItem(orderItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const [newOrderItem] = yield db.insert(orderItems).values(orderItem).returning();
            return newOrderItem;
        });
    }
    updateOrderItem(id, orderItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updated] = yield db.update(orderItems)
                .set(orderItem)
                .where(eq(orderItems.id, id))
                .returning();
            return updated || undefined;
        });
    }
    deleteOrderItem(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield db.delete(orderItems).where(eq(orderItems.id, id));
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        });
    }
    // Sales
    getSales() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(sales)
                .where(isNull(sales.deletedAt))
                .orderBy(desc(sales.createdAt));
        });
    }
    getDeletedSales() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(sales)
                .where(isNotNull(sales.deletedAt))
                .orderBy(desc(sales.deletedAt));
        });
    }
    getSalesByDateRange(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(sales)
                .where(and(gte(sales.createdAt, startDate), lte(sales.createdAt, endDate)))
                .orderBy(desc(sales.createdAt));
        });
    }
    createSale(sale) {
        return __awaiter(this, void 0, void 0, function* () {
            const [newSale] = yield db.insert(sales).values(sale).returning();
            return newSale;
        });
    }
    deleteSale(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.update(sales)
                .set({ deletedAt: new Date() })
                .where(eq(sales.id, id));
            return (result.rowCount || 0) > 0;
        });
    }
    // Expenses
    getExpenses() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(expenses)
                .where(isNull(expenses.deletedAt))
                .orderBy(desc(expenses.createdAt));
        });
    }
    getDeletedExpenses() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(expenses)
                .where(isNotNull(expenses.deletedAt))
                .orderBy(desc(expenses.deletedAt));
        });
    }
    getExpensesByDateRange(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(expenses)
                .where(and(gte(expenses.createdAt, startDate), lte(expenses.createdAt, endDate)))
                .orderBy(desc(expenses.createdAt));
        });
    }
    createExpense(expense) {
        return __awaiter(this, void 0, void 0, function* () {
            const [newExpense] = yield db.insert(expenses).values(expense).returning();
            return newExpense;
        });
    }
    updateExpense(id, expense) {
        return __awaiter(this, void 0, void 0, function* () {
            const [updated] = yield db.update(expenses)
                .set(expense)
                .where(eq(expenses.id, id))
                .returning();
            return updated || undefined;
        });
    }
    deleteExpense(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const result = yield db.update(expenses)
                .set({ deletedAt: new Date() })
                .where(eq(expenses.id, id));
            return ((_a = result.rowCount) !== null && _a !== void 0 ? _a : 0) > 0;
        });
    }
    // Analytics
    getWeeklyStats() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const now = new Date();
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Lundi
            startOfWeek.setHours(0, 0, 0, 0);
            const weeklyData = [];
            const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
            for (let i = 0; i < 7; i++) {
                const currentDay = new Date(startOfWeek);
                currentDay.setDate(startOfWeek.getDate() + i);
                const nextDay = new Date(currentDay);
                nextDay.setDate(currentDay.getDate() + 1);
                const salesData = yield db.select({
                    total: sum(sales.amount)
                }).from(sales)
                    .where(and(gte(sales.createdAt, currentDay), lte(sales.createdAt, nextDay), isNull(sales.deletedAt)));
                const ordersData = yield db.select().from(orders)
                    .where(and(gte(orders.createdAt, currentDay), lte(orders.createdAt, nextDay), isNull(orders.deletedAt)));
                weeklyData.push({
                    day: dayNames[i],
                    date: currentDay,
                    sales: Number(((_a = salesData[0]) === null || _a === void 0 ? void 0 : _a.total) || 0),
                    orders: ordersData.length
                });
            }
            return weeklyData;
        });
    }
    getDailyStats(date) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            const salesData = yield db.select({
                total: sum(sales.amount),
                count: sum(sales.amount).mapWith(Number)
            }).from(sales)
                .where(and(gte(sales.createdAt, startOfDay), lte(sales.createdAt, endOfDay), isNull(sales.deletedAt)));
            const expensesData = yield db.select({
                total: sum(expenses.amount)
            }).from(expenses)
                .where(and(gte(expenses.createdAt, startOfDay), lte(expenses.createdAt, endOfDay), isNull(expenses.deletedAt)));
            const ordersData = yield db.select().from(orders)
                .where(and(gte(orders.createdAt, startOfDay), lte(orders.createdAt, endOfDay), isNull(orders.deletedAt)));
            const totalSales = Number(((_a = salesData[0]) === null || _a === void 0 ? void 0 : _a.total) || 0);
            const totalExpenses = Number(((_b = expensesData[0]) === null || _b === void 0 ? void 0 : _b.total) || 0);
            const orderCount = ordersData.length;
            const profit = totalSales - totalExpenses;
            return {
                totalSales,
                totalExpenses,
                profit,
                orderCount,
            };
        });
    }
    // Super Admin operations
    getSuperAdmin(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [superAdmin] = yield db.select().from(superAdmins).where(eq(superAdmins.id, id));
            return superAdmin;
        });
    }
    getSuperAdminByUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const [superAdmin] = yield db.select().from(superAdmins).where(eq(superAdmins.username, username));
            return superAdmin;
        });
    }
    createSuperAdmin(insertSuperAdmin) {
        return __awaiter(this, void 0, void 0, function* () {
            const [superAdmin] = yield db
                .insert(superAdmins)
                .values(insertSuperAdmin)
                .returning();
            return superAdmin;
        });
    }
    resetAllData() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Supprimer toutes les données dans l'ordre correct (en tenant compte des clés étrangères)
                console.log("🔄 Début de la réinitialisation complète du système...");
                // D'abord supprimer les ventes qui référencent les commandes
                yield db.delete(sales);
                console.log("✅ Ventes supprimées");
                // Puis supprimer les items de commande qui référencent les commandes et produits
                yield db.delete(orderItems);
                console.log("✅ Items de commande supprimés");
                // Ensuite supprimer les commandes
                yield db.delete(orders);
                console.log("✅ Commandes supprimées");
                // Supprimer les dépenses
                yield db.delete(expenses);
                console.log("✅ Dépenses supprimées");
                // Supprimer les produits qui référencent les catégories
                yield db.delete(products);
                console.log("✅ Produits supprimés");
                // Supprimer les catégories
                yield db.delete(categories);
                console.log("✅ Catégories supprimées");
                // Supprimer les tables
                yield db.delete(tables);
                console.log("✅ Tables supprimées");
                // Supprimer les utilisateurs (sauf super admin)
                yield db.delete(users);
                console.log("✅ Utilisateurs supprimés");
                console.log("🎉 Réinitialisation système terminée avec succès !");
                // Recréer les données de base essentielles
                console.log("🔄 Création des données de base...");
                // Créer les catégories de base
                yield db.insert(categories).values([
                    { name: "Boissons", description: "Boissons chaudes et froides" },
                    { name: "Plats Principaux", description: "Plats de résistance" },
                    { name: "Desserts", description: "Desserts et sucreries" }
                ]);
                console.log("✅ Catégories de base créées");
                // Créer les tables de base avec QR codes
                const baseUrl = process.env.REPLIT_DOMAINS ?
                    `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` :
                    'http://localhost:5000';
                yield db.insert(tables).values([
                    { number: 1, capacity: 4, qrCode: `${baseUrl}/menu/1` },
                    { number: 2, capacity: 6, qrCode: `${baseUrl}/menu/2` },
                    { number: 3, capacity: 2, qrCode: `${baseUrl}/menu/3` },
                    { number: 4, capacity: 8, qrCode: `${baseUrl}/menu/4` },
                    { number: 5, capacity: 4, qrCode: `${baseUrl}/menu/5` }
                ]);
                console.log("✅ Tables de base créées avec QR codes");
            }
            catch (error) {
                console.error("❌ Erreur lors de la réinitialisation:", error);
                throw error;
            }
            // Créer l'administrateur par défaut
            const hashedPassword = yield bcrypt.hash("admin123", 10);
            yield db.insert(users).values({
                username: "admin",
                password: hashedPassword,
                fullName: "Administrateur",
                role: "admin",
                permissions: DEFAULT_PERMISSIONS.admin,
            });
            console.log("✅ Administrateur par défaut créé avec toutes les permissions");
        });
    }
    // System tabs management
    getSystemTabs() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(systemTabs).orderBy(asc(systemTabs.order));
        });
    }
    createSystemTab(tab) {
        return __awaiter(this, void 0, void 0, function* () {
            const [systemTab] = yield db.insert(systemTabs).values(tab).returning();
            return systemTab;
        });
    }
    updateSystemTab(id, tab) {
        return __awaiter(this, void 0, void 0, function* () {
            const [systemTab] = yield db.update(systemTabs).set(tab).where(eq(systemTabs.id, id)).returning();
            return systemTab;
        });
    }
    deleteSystemTab(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield db.delete(systemTabs).where(eq(systemTabs.id, id));
            return result.rowCount > 0;
        });
    }
    toggleSystemTab(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const tab = yield db.select().from(systemTabs).where(eq(systemTabs.id, id)).limit(1);
            if (tab.length === 0)
                return false;
            yield db.update(systemTabs).set({ isActive: !tab[0].isActive }).where(eq(systemTabs.id, id));
            return true;
        });
    }
    // System updates management
    getSystemUpdates() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(systemUpdates).orderBy(desc(systemUpdates.createdAt));
        });
    }
    createSystemUpdate(update) {
        return __awaiter(this, void 0, void 0, function* () {
            const [systemUpdate] = yield db.insert(systemUpdates).values(update).returning();
            return systemUpdate;
        });
    }
    deploySystemUpdate(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const [systemUpdate] = yield db.update(systemUpdates).set({
                isDeployed: true,
                deployedAt: new Date()
            }).where(eq(systemUpdates.id, id)).returning();
            return !!systemUpdate;
        });
    }
    // System settings management
    getSystemSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield db.select().from(systemSettings).orderBy(systemSettings.category, systemSettings.key);
        });
    }
    getSystemSetting(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const [setting] = yield db.select().from(systemSettings).where(eq(systemSettings.key, key));
            return setting;
        });
    }
    createSystemSetting(setting) {
        return __awaiter(this, void 0, void 0, function* () {
            const [newSetting] = yield db.insert(systemSettings).values(setting).returning();
            return newSetting;
        });
    }
    updateSystemSetting(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [updated] = yield db
                    .update(systemSettings)
                    .set({
                    value,
                    updatedAt: new Date()
                })
                    .where(eq(systemSettings.key, key))
                    .returning();
                return updated;
            }
            catch (error) {
                console.error("Erreur lors de la mise à jour du paramètre:", error);
                return undefined;
            }
        });
    }
}
export const storage = new DatabaseStorage();
