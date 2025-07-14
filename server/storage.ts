import { 
  users, categories, products, tables, orders, orderItems, sales, expenses, superAdmins,
  systemTabs, systemUpdates, systemSettings,
  type User, type InsertUser, type Category, type InsertCategory,
  type Product, type InsertProduct, type Table, type InsertTable,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type Sale, type InsertSale, type Expense, type InsertExpense,
  type SuperAdmin, type InsertSuperAdmin, type SystemTab, type InsertSystemTab,
  type SystemUpdate, type InsertSystemUpdate, type SystemSetting, type InsertSystemSetting
} from "@shared/schema";
import { DEFAULT_PERMISSIONS } from "@shared/permissions";
import { db } from "./db";
import { eq, desc, and, gte, lte, sum, ne, isNull, isNotNull } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;

  // Products
  getProducts(): Promise<Product[]>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Tables
  getTables(): Promise<Table[]>;
  getTable(id: number): Promise<Table | undefined>;
  getTableByNumber(number: number): Promise<Table | undefined>;
  createTable(table: InsertTable): Promise<Table>;
  updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined>;
  deleteTable(id: number): Promise<boolean>;

  // Orders
  getOrders(): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]>;
  getActiveOrders(): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]>;
  getDeletedOrders(): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]>;
  getOrder(id: number): Promise<Order | undefined>;
  getOrderWithItems(id: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Order Items
  getOrderItems(orderId: number): Promise<(OrderItem & { product: Product })[]>;
  createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;

  // Sales
  getSales(): Promise<Sale[]>;
  getDeletedSales(): Promise<Sale[]>;
  getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]>;
  createSale(sale: InsertSale): Promise<Sale>;
  deleteSale(id: number): Promise<boolean>;

  // Expenses
  getExpenses(): Promise<Expense[]>;
  getDeletedExpenses(): Promise<Expense[]>;
  getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Analytics
  getWeeklyStats(): Promise<Array<{
    day: string;
    date: Date;
    sales: number;
    orders: number;
  }>>;
  getDailyStats(date: Date): Promise<{
    totalSales: number;
    totalExpenses: number;
    profit: number;
    orderCount: number;
  }>;

  // Super Admin operations
  getSuperAdmin(id: number): Promise<SuperAdmin | undefined>;
  getSuperAdminByUsername(username: string): Promise<SuperAdmin | undefined>;
  createSuperAdmin(superAdmin: InsertSuperAdmin): Promise<SuperAdmin>;
  resetAllData(): Promise<void>;

  // System tabs management
  getSystemTabs(): Promise<SystemTab[]>;
  createSystemTab(tab: InsertSystemTab): Promise<SystemTab>;
  updateSystemTab(id: number, tab: Partial<InsertSystemTab>): Promise<SystemTab | undefined>;
  deleteSystemTab(id: number): Promise<boolean>;
  toggleSystemTab(id: number): Promise<boolean>;

  // System updates management
  getSystemUpdates(): Promise<SystemUpdate[]>;
  createSystemUpdate(update: InsertSystemUpdate): Promise<SystemUpdate>;
  deploySystemUpdate(id: number): Promise<boolean>;

  // System settings management
  getSystemSettings(): Promise<SystemSetting[]>;
  getSystemSetting(key: string): Promise<SystemSetting | undefined>;
  createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting>;
  updateSystemSetting(key: string, value: string): Promise<SystemSetting | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
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

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.isActive, true));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = Object.fromEntries(
      Object.entries(userData).filter(([_, value]) => value !== undefined)
    );
    
    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.update(users)
      .set({ isActive: false })
      .where(eq(users.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.archived, false))
      .orderBy(products.name);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return await db.select().from(products)
      .where(eq(products.categoryId, categoryId))
      .orderBy(products.name);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProduct(id: number): Promise<boolean> {
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
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }

  // Tables
  async getTables(): Promise<Table[]> {
    return await db.select().from(tables).orderBy(tables.number);
  }

  async getTable(id: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.id, id));
    return table || undefined;
  }

  async getTableByNumber(number: number): Promise<Table | undefined> {
    const [table] = await db.select().from(tables).where(eq(tables.number, number));
    return table || undefined;
  }

  async createTable(table: InsertTable): Promise<Table> {
    const [newTable] = await db.insert(tables).values(table).returning();
    return newTable;
  }

  async updateTable(id: number, table: Partial<InsertTable>): Promise<Table | undefined> {
    const [updated] = await db.update(tables)
      .set(table)
      .where(eq(tables.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteTable(id: number): Promise<boolean> {
    const result = await db.delete(tables).where(eq(tables.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Orders
  async getOrders(): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]> {
    const ordersData = await db.select().from(orders)
      .where(isNull(orders.deletedAt))
      .orderBy(desc(orders.createdAt));
    
    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        return { ...order, orderItems: items };
      })
    );
    
    return ordersWithItems;
  }

  async getDeletedOrders(): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]> {
    const ordersData = await db.select().from(orders)
      .where(isNotNull(orders.deletedAt))
      .orderBy(desc(orders.deletedAt));
    
    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        return { ...order, orderItems: items };
      })
    );
    
    return ordersWithItems;
  }

  async getActiveOrders(): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] })[]> {
    const activeOrdersData = await db.select().from(orders)
      .where(and(
        ne(orders.status, 'completed'),
        ne(orders.status, 'cancelled')
      ))
      .orderBy(desc(orders.createdAt));
    
    const ordersWithItems = await Promise.all(
      activeOrdersData.map(async (order) => {
        const items = await this.getOrderItems(order.id);
        return { ...order, orderItems: items };
      })
    );
    
    return ordersWithItems;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderWithItems(id: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;

    const items = await this.getOrderItems(id);
    return { ...order, orderItems: items };
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    // Ensure total is provided
    const orderWithTotal = {
      ...order,
      total: order.total || "0.00"
    };
    const [newOrder] = await db.insert(orders).values(orderWithTotal).returning();
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    // Ensure total is provided for updates, filtering out undefined values
    const updateData = Object.fromEntries(
      Object.entries(order).filter(([_, value]) => value !== undefined)
    );
    
    const [updated] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const result = await db.update(orders)
      .set({ deletedAt: new Date() })
      .where(eq(orders.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<(OrderItem & { product: Product })[]> {
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

  async createOrderItem(orderItem: InsertOrderItem): Promise<OrderItem> {
    const [newOrderItem] = await db.insert(orderItems).values(orderItem).returning();
    return newOrderItem;
  }

  async updateOrderItem(id: number, orderItem: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const [updated] = await db.update(orderItems)
      .set(orderItem)
      .where(eq(orderItems.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteOrderItem(id: number): Promise<boolean> {
    const result = await db.delete(orderItems).where(eq(orderItems.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Sales
  async getSales(): Promise<Sale[]> {
    return await db.select().from(sales)
      .where(isNull(sales.deletedAt))
      .orderBy(desc(sales.createdAt));
  }

  async getDeletedSales(): Promise<Sale[]> {
    return await db.select().from(sales)
      .where(isNotNull(sales.deletedAt))
      .orderBy(desc(sales.deletedAt));
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return await db.select().from(sales)
      .where(and(
        gte(sales.createdAt, startDate),
        lte(sales.createdAt, endDate)
      ))
      .orderBy(desc(sales.createdAt));
  }

  async createSale(sale: InsertSale): Promise<Sale> {
    const [newSale] = await db.insert(sales).values(sale).returning();
    return newSale;
  }

  async deleteSale(id: number): Promise<boolean> {
    const result = await db.update(sales)
      .set({ deletedAt: new Date() })
      .where(eq(sales.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Expenses
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(isNull(expenses.deletedAt))
      .orderBy(desc(expenses.createdAt));
  }

  async getDeletedExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(isNotNull(expenses.deletedAt))
      .orderBy(desc(expenses.deletedAt));
  }

  async getExpensesByDateRange(startDate: Date, endDate: Date): Promise<Expense[]> {
    return await db.select().from(expenses)
      .where(and(
        gte(expenses.createdAt, startDate),
        lte(expenses.createdAt, endDate)
      ))
      .orderBy(desc(expenses.createdAt));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db.insert(expenses).values(expense).returning();
    return newExpense;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const [updated] = await db.update(expenses)
      .set(expense)
      .where(eq(expenses.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await db.update(expenses)
      .set({ deletedAt: new Date() })
      .where(eq(expenses.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Analytics
  async getWeeklyStats(): Promise<Array<{
    day: string;
    date: Date;
    sales: number;
    orders: number;
  }>> {
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
        .where(and(
          gte(sales.createdAt, currentDay),
          lte(sales.createdAt, nextDay),
          isNull(sales.deletedAt)
        ));

      const ordersData = await db.select().from(orders)
        .where(and(
          gte(orders.createdAt, currentDay),
          lte(orders.createdAt, nextDay),
          isNull(orders.deletedAt)
        ));

      weeklyData.push({
        day: dayNames[i],
        date: currentDay,
        sales: Number(salesData[0]?.total || 0),
        orders: ordersData.length
      });
    }

    return weeklyData;
  }

  async getDailyStats(date: Date): Promise<{
    totalSales: number;
    totalExpenses: number;
    profit: number;
    orderCount: number;
  }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const salesData = await db.select({
      total: sum(sales.amount),
      count: sum(sales.amount).mapWith(Number)
    }).from(sales)
      .where(and(
        gte(sales.createdAt, startOfDay),
        lte(sales.createdAt, endOfDay),
        isNull(sales.deletedAt)
      ));

    const expensesData = await db.select({
      total: sum(expenses.amount)
    }).from(expenses)
      .where(and(
        gte(expenses.createdAt, startOfDay),
        lte(expenses.createdAt, endOfDay),
        isNull(expenses.deletedAt)
      ));

    const ordersData = await db.select().from(orders)
      .where(and(
        gte(orders.createdAt, startOfDay),
        lte(orders.createdAt, endOfDay),
        isNull(orders.deletedAt)
      ));

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
  async getSuperAdmin(id: number): Promise<SuperAdmin | undefined> {
    const [superAdmin] = await db.select().from(superAdmins).where(eq(superAdmins.id, id));
    return superAdmin;
  }

  async getSuperAdminByUsername(username: string): Promise<SuperAdmin | undefined> {
    const [superAdmin] = await db.select().from(superAdmins).where(eq(superAdmins.username, username));
    return superAdmin;
  }

  async createSuperAdmin(insertSuperAdmin: InsertSuperAdmin): Promise<SuperAdmin> {
    const [superAdmin] = await db
      .insert(superAdmins)
      .values(insertSuperAdmin)
      .returning();
    return superAdmin;
  }

  async resetAllData(): Promise<void> {
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
      
    } catch (error) {
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
  async getSystemTabs(): Promise<SystemTab[]> {
    return await db.select().from(systemTabs).orderBy(asc(systemTabs.order));
  }

  async createSystemTab(tab: InsertSystemTab): Promise<SystemTab> {
    const [systemTab] = await db.insert(systemTabs).values(tab).returning();
    return systemTab;
  }

  async updateSystemTab(id: number, tab: Partial<InsertSystemTab>): Promise<SystemTab | undefined> {
    const [systemTab] = await db.update(systemTabs).set(tab).where(eq(systemTabs.id, id)).returning();
    return systemTab;
  }

  async deleteSystemTab(id: number): Promise<boolean> {
    const result = await db.delete(systemTabs).where(eq(systemTabs.id, id));
    return result.rowCount! > 0;
  }

  async toggleSystemTab(id: number): Promise<boolean> {
    const tab = await db.select().from(systemTabs).where(eq(systemTabs.id, id)).limit(1);
    if (tab.length === 0) return false;
    
    await db.update(systemTabs).set({ isActive: !tab[0].isActive }).where(eq(systemTabs.id, id));
    return true;
  }

  // System updates management
  async getSystemUpdates(): Promise<SystemUpdate[]> {
    return await db.select().from(systemUpdates).orderBy(desc(systemUpdates.createdAt));
  }

  async createSystemUpdate(update: InsertSystemUpdate): Promise<SystemUpdate> {
    const [systemUpdate] = await db.insert(systemUpdates).values(update).returning();
    return systemUpdate;
  }

  async deploySystemUpdate(id: number): Promise<boolean> {
    const [systemUpdate] = await db.update(systemUpdates).set({ 
      isDeployed: true, 
      deployedAt: new Date() 
    }).where(eq(systemUpdates.id, id)).returning();
    return !!systemUpdate;
  }

  // System settings management
  async getSystemSettings(): Promise<SystemSetting[]> {
    return await db.select().from(systemSettings).orderBy(systemSettings.category, systemSettings.key);
  }

  async getSystemSetting(key: string): Promise<SystemSetting | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async createSystemSetting(setting: InsertSystemSetting): Promise<SystemSetting> {
    const [newSetting] = await db.insert(systemSettings).values(setting).returning();
    return newSetting;
  }

  async updateSystemSetting(key: string, value: string): Promise<SystemSetting | undefined> {
    try {
      const [updated] = await db
        .update(systemSettings)
        .set({ 
          value,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.key, key))
        .returning();
      
      return updated;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du paramètre:", error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();
