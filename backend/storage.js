import { users, categories, products, tables, orders, orderItems, sales, expenses, superAdmins, systemTabs, systemUpdates, systemSettings } from "@shared-types/schema";
import { DEFAULT_PERMISSIONS } from "@shared-types/permissions";
import { db } from "./db";
import { eq, desc, and, gte, lte, sum, ne, isNull, isNotNull, asc } from "drizzle-orm";
import bcrypt from "bcrypt";
export class DatabaseStorage {
    // Users
    async getUser(id) {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || undefined;
    }
    async getUserByUsername(username) {
        const result = await db.select({
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
    }
    async getUsers() {
        return await db.select().from(users).where(eq(users.isActive, true));
    }
    async createUser(insertUser) {
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
    }
    async updateUser(id, userData) {
        const updateData = Object.fromEntries(Object.entries(userData).filter(([_, value]) => value !== undefined));
        const [updated] = await db.update(users)
            .set(updateData)
            .where(eq(users.id, id))
            .returning();
        return updated || undefined;
    }
    async deleteUser(id) {
        const result = await db.update(users)
            .set({ isActive: false })
            .where(eq(users.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    // Categories
    async getCategories() {
        return await db.select().from(categories).orderBy(categories.name);
    }
    async createCategory(category) {
        const [newCategory] = await db.insert(categories).values(category).returning();
        return newCategory;
    }
    async updateCategory(id, category) {
        const [updated] = await db.update(categories)
            .set(category)
            .where(eq(categories.id, id))
            .returning();
        return updated || undefined;
    }
    async deleteCategory(id) {
        const result = await db.delete(categories).where(eq(categories.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    // Products
    async getProducts() {
        return await db.select().from(products)
            .where(eq(products.archived, false))
            .orderBy(products.name);
    }
    async getProductsByCategory(categoryId) {
        return await db.select().from(products)
            .where(eq(products.categoryId, categoryId))
            .orderBy(products.name);
    }
    async getProduct(id) {
        const [product] = await db.select().from(products).where(eq(products.id, id));
        return product || undefined;
    }
    async createProduct(product) {
        const [newProduct] = await db.insert(products).values(product).returning();
        return newProduct;
    }
    async updateProduct(id, product) {
        const [updated] = await db.update(products)
            .set(product)
            .where(eq(products.id, id))
            .returning();
        return updated || undefined;
    }
    async deleteProduct(id) {
        try {
            // First check if the product exists
            const [product] = await db.select().from(products).where(eq(products.id, id));
            if (!product) {
                return false;
            }
            // Check if product is used in any order items
            const [orderItem] = await db.select().from(orderItems).where(eq(orderItems.productId, id));
            if (orderItem) {
                // Instead of deleting, archive the product
                const [archived] = await db.update(products)
                    .set({ archived: true, available: false })
                    .where(eq(products.id, id))
                    .returning();
                return !!archived;
            }
            // If not used in orders, delete permanently
            const result = await db.delete(products).where(eq(products.id, id));
            return (result.rowCount ?? 0) > 0;
        }
        catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    }
    // Tables
    async getTables() {
        return await db.select().from(tables).orderBy(tables.number);
    }
    async getTable(id) {
        const [table] = await db.select().from(tables).where(eq(tables.id, id));
        return table || undefined;
    }
    async getTableByNumber(number) {
        const [table] = await db.select().from(tables).where(eq(tables.number, number));
        return table || undefined;
    }
    async createTable(table) {
        const [newTable] = await db.insert(tables).values(table).returning();
        return newTable;
    }
    async updateTable(id, table) {
        const [updated] = await db.update(tables)
            .set(table)
            .where(eq(tables.id, id))
            .returning();
        return updated || undefined;
    }
    async deleteTable(id) {
        const result = await db.delete(tables).where(eq(tables.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    // Orders
    async getOrders() {
        const ordersData = await db.select().from(orders)
            .where(isNull(orders.deletedAt))
            .orderBy(desc(orders.createdAt));
        const ordersWithItems = await Promise.all(ordersData.map(async (order) => {
            const items = await this.getOrderItems(order.id);
            return { ...order, orderItems: items };
        }));
        return ordersWithItems;
    }
    async getDeletedOrders() {
        const ordersData = await db.select().from(orders)
            .where(isNotNull(orders.deletedAt))
            .orderBy(desc(orders.deletedAt));
        const ordersWithItems = await Promise.all(ordersData.map(async (order) => {
            const items = await this.getOrderItems(order.id);
            return { ...order, orderItems: items };
        }));
        return ordersWithItems;
    }
    async getActiveOrders() {
        const activeOrdersData = await db.select().from(orders)
            .where(and(ne(orders.status, 'completed'), ne(orders.status, 'cancelled')))
            .orderBy(desc(orders.createdAt));
        const ordersWithItems = await Promise.all(activeOrdersData.map(async (order) => {
            const items = await this.getOrderItems(order.id);
            return { ...order, orderItems: items };
        }));
        return ordersWithItems;
    }
    async getOrder(id) {
        const [order] = await db.select().from(orders).where(eq(orders.id, id));
        return order || undefined;
    }
    async getOrderWithItems(id) {
        const order = await this.getOrder(id);
        if (!order)
            return undefined;
        const items = await this.getOrderItems(id);
        return { ...order, orderItems: items };
    }
    async createOrder(order) {
        // Ensure total is provided
        const orderWithTotal = {
            ...order,
            total: order.total || "0.00"
        };
        const [newOrder] = await db.insert(orders).values(orderWithTotal).returning();
        return newOrder;
    }
    async updateOrder(id, order) {
        // Ensure total is provided for updates, filtering out undefined values
        const updateData = Object.fromEntries(Object.entries(order).filter(([_, value]) => value !== undefined));
        const [updated] = await db.update(orders)
            .set(updateData)
            .where(eq(orders.id, id))
            .returning();
        return updated || undefined;
    }
    async deleteOrder(id) {
        const result = await db.update(orders)
            .set({ deletedAt: new Date() })
            .where(eq(orders.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    // Order Items
    async getOrderItems(orderId) {
        return await db
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
    }
    async createOrderItem(orderItem) {
        const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
        return newOrderItem;
    }
    async updateOrderItem(id, orderItem) {
        const [updated] = await db.update(orderItems)
            .set(orderItem)
            .where(eq(orderItems.id, id))
            .returning();
        return updated || undefined;
    }
    async deleteOrderItem(id) {
        const result = await db.delete(orderItems).where(eq(orderItems.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    // Sales
    async getSales() {
        return await db.select().from(sales)
            .where(isNull(sales.deletedAt))
            .orderBy(desc(sales.createdAt));
    }
    async getDeletedSales() {
        return await db.select().from(sales)
            .where(isNotNull(sales.deletedAt))
            .orderBy(desc(sales.deletedAt));
    }
    async getSalesByDateRange(startDate, endDate) {
        return await db.select().from(sales)
            .where(and(gte(sales.createdAt, startDate), lte(sales.createdAt, endDate)))
            .orderBy(desc(sales.createdAt));
    }
    async createSale(sale) {
        const [newSale] = await db.insert(sales).values(sale).returning();
        return newSale;
    }
    async deleteSale(id) {
        const result = await db.update(sales)
            .set({ deletedAt: new Date() })
            .where(eq(sales.id, id));
        return (result.rowCount || 0) > 0;
    }
    // Expenses
    async getExpenses() {
        return await db.select().from(expenses)
            .where(isNull(expenses.deletedAt))
            .orderBy(desc(expenses.createdAt));
    }
    async getDeletedExpenses() {
        return await db.select().from(expenses)
            .where(isNotNull(expenses.deletedAt))
            .orderBy(desc(expenses.deletedAt));
    }
    async getExpensesByDateRange(startDate, endDate) {
        return await db.select().from(expenses)
            .where(and(gte(expenses.createdAt, startDate), lte(expenses.createdAt, endDate)))
            .orderBy(desc(expenses.createdAt));
    }
    async createExpense(expense) {
        const [newExpense] = await db.insert(expenses).values(expense).returning();
        return newExpense;
    }
    async updateExpense(id, expense) {
        const [updated] = await db.update(expenses)
            .set(expense)
            .where(eq(expenses.id, id))
            .returning();
        return updated || undefined;
    }
    async deleteExpense(id) {
        const result = await db.update(expenses)
            .set({ deletedAt: new Date() })
            .where(eq(expenses.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    // Analytics
    async getWeeklyStats() {
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
            const salesData = await db.select({
                total: sum(sales.amount)
            }).from(sales)
                .where(and(gte(sales.createdAt, currentDay), lte(sales.createdAt, nextDay), isNull(sales.deletedAt)));
            const ordersData = await db.select().from(orders)
                .where(and(gte(orders.createdAt, currentDay), lte(orders.createdAt, nextDay), isNull(orders.deletedAt)));
            weeklyData.push({
                day: dayNames[i],
                date: currentDay,
                sales: Number(salesData[0]?.total || 0),
                orders: ordersData.length
            });
        }
        return weeklyData;
    }
    async getDailyStats(date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        const salesData = await db.select({
            total: sum(sales.amount),
            count: sum(sales.amount).mapWith(Number)
        }).from(sales)
            .where(and(gte(sales.createdAt, startOfDay), lte(sales.createdAt, endOfDay), isNull(sales.deletedAt)));
        const expensesData = await db.select({
            total: sum(expenses.amount)
        }).from(expenses)
            .where(and(gte(expenses.createdAt, startOfDay), lte(expenses.createdAt, endOfDay), isNull(expenses.deletedAt)));
        const ordersData = await db.select().from(orders)
            .where(and(gte(orders.createdAt, startOfDay), lte(orders.createdAt, endOfDay), isNull(orders.deletedAt)));
        const totalSales = Number(salesData[0]?.total || 0);
        const totalExpenses = Number(expensesData[0]?.total || 0);
        const orderCount = ordersData.length;
        const profit = totalSales - totalExpenses;
        return {
            totalSales,
            totalExpenses,
            profit,
            orderCount,
        };
    }
    // Super Admin operations
    async getSuperAdmin(id) {
        const [superAdmin] = await db.select().from(superAdmins).where(eq(superAdmins.id, id));
        return superAdmin;
    }
    async getSuperAdminByUsername(username) {
        const [superAdmin] = await db.select().from(superAdmins).where(eq(superAdmins.username, username));
        return superAdmin;
    }
    async createSuperAdmin(insertSuperAdmin) {
        const [superAdmin] = await db
            .insert(superAdmins)
            .values(insertSuperAdmin)
            .returning();
        return superAdmin;
    }
    async resetAllData() {
        try {
            // Supprimer toutes les données dans l'ordre correct (en tenant compte des clés étrangères)
            console.log("🔄 Début de la réinitialisation complète du système...");
            // D'abord supprimer les ventes qui référencent les commandes
            await db.delete(sales);
            console.log("✅ Ventes supprimées");
            // Puis supprimer les items de commande qui référencent les commandes et produits
            await db.delete(orderItems);
            console.log("✅ Items de commande supprimés");
            // Ensuite supprimer les commandes
            await db.delete(orders);
            console.log("✅ Commandes supprimées");
            // Supprimer les dépenses
            await db.delete(expenses);
            console.log("✅ Dépenses supprimées");
            // Supprimer les produits qui référencent les catégories
            await db.delete(products);
            console.log("✅ Produits supprimés");
            // Supprimer les catégories
            await db.delete(categories);
            console.log("✅ Catégories supprimées");
            // Supprimer les tables
            await db.delete(tables);
            console.log("✅ Tables supprimées");
            // Supprimer les utilisateurs (sauf super admin)
            await db.delete(users);
            console.log("✅ Utilisateurs supprimés");
            console.log("🎉 Réinitialisation système terminée avec succès !");
            // Recréer les données de base essentielles
            console.log("🔄 Création des données de base...");
            // Créer les catégories de base
            await db.insert(categories).values([
                { name: "Boissons", description: "Boissons chaudes et froides" },
                { name: "Plats Principaux", description: "Plats de résistance" },
                { name: "Desserts", description: "Desserts et sucreries" }
            ]);
            console.log("✅ Catégories de base créées");
            // Créer les tables de base avec QR codes
            const baseUrl = process.env.REPLIT_DOMAINS ?
                `https://${process.env.REPLIT_DOMAINS.split(',')[0]}` :
                'http://localhost:5000';
            await db.insert(tables).values([
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
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await db.insert(users).values({
            username: "admin",
            password: hashedPassword,
            fullName: "Administrateur",
            role: "admin",
            permissions: DEFAULT_PERMISSIONS.admin,
        });
        console.log("✅ Administrateur par défaut créé avec toutes les permissions");
    }
    // System tabs management
    async getSystemTabs() {
        return await db.select().from(systemTabs).orderBy(asc(systemTabs.order));
    }
    async createSystemTab(tab) {
        const [systemTab] = await db.insert(systemTabs).values(tab).returning();
        return systemTab;
    }
    /**
     * Met à jour un onglet système existant.
     * @param id L'ID de l'onglet.
     * @param tab Les données de l'onglet à mettre à jour.
     * @returns L'onglet mis à jour ou undefined si non trouvé.
     */
    async updateSystemTab(id, tab) {
        const [updated] = await db.update(systemTabs)
            .set(tab)
            .where(eq(systemTabs.id, id))
            .returning();
        return updated || undefined;
    }
    /**
     * Supprime un onglet système par son ID.
     * @param id L'ID de l'onglet à supprimer.
     * @returns Vrai si la suppression a réussi, faux sinon.
     */
    async deleteSystemTab(id) {
        const result = await db.delete(systemTabs).where(eq(systemTabs.id, id));
        return (result.rowCount ?? 0) > 0;
    }
    /**
     * Active ou désactive un onglet système.
     * @param id L'ID de l'onglet à basculer.
     * @returns Vrai si la mise à jour a réussi, faux sinon.
     */
    async toggleSystemTab(id) {
        const [tab] = await db.select().from(systemTabs).where(eq(systemTabs.id, id));
        if (!tab) {
            return false;
        }
        const [updated] = await db.update(systemTabs)
            .set({ isActive: !tab.isActive })
            .where(eq(systemTabs.id, id))
            .returning();
        return !!updated;
    }
    // System updates management
    /**
     * Récupère toutes les mises à jour système, triées par date de création.
     * @returns Une promesse résolue avec un tableau de SystemUpdate.
     */
    async getSystemUpdates() {
        return await db.select().from(systemUpdates).orderBy(desc(systemUpdates.createdAt));
    }
    /**
     * Crée une nouvelle entrée de mise à jour système.
     * @param update Les données de la mise à jour.
     * @returns La mise à jour nouvellement créée.
     */
    async createSystemUpdate(update) {
        const [newUpdate] = await db.insert(systemUpdates).values(update).returning();
        return newUpdate;
    }
    /**
     * Simule le déploiement d'une mise à jour système en marquant la date de déploiement.
     * @param id L'ID de la mise à jour à déployer.
     * @returns Vrai si la mise à jour a réussi, faux sinon.
     */
    async deploySystemUpdate(id) {
        const [updated] = await db.update(systemUpdates)
            .set({ deployedAt: new Date() })
            .where(eq(systemUpdates.id, id))
            .returning();
        return !!updated;
    }
    // System settings management
    /**
     * Récupère tous les paramètres système.
     * @returns Une promesse résolue avec un tableau de SystemSetting.
     */
    async getSystemSettings() {
        return await db.select().from(systemSettings);
    }
    /**
     * Récupère un paramètre système par sa clé.
     * @param key La clé du paramètre à récupérer.
     * @returns Le paramètre trouvé ou undefined.
     */
    async getSystemSetting(key) {
        const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
        return setting || undefined;
    }
    /**
     * Crée un nouveau paramètre système.
     * @param setting Les données du paramètre.
     * @returns Le paramètre nouvellement créé.
     */
    async createSystemSetting(setting) {
        const [newSetting] = await db.insert(systemSettings).values(setting).returning();
        return newSetting;
    }
    /**
     * Met à jour la valeur d'un paramètre système par sa clé.
     * @param key La clé du paramètre à mettre à jour.
     * @param value La nouvelle valeur.
     * @returns Le paramètre mis à jour ou undefined.
     */
    async updateSystemSetting(key, value) {
        const [updated] = await db.update(systemSettings)
            .set({ value })
            .where(eq(systemSettings.key, key))
            .returning();
        return updated || undefined;
    }
}
export const storage = new DatabaseStorage();
