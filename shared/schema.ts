import { pgTable, text, serial, integer, boolean, timestamp, decimal, uuid, jsonb } from "drizzle-orm/pg-core";
import { sql } from 'drizzle-orm'; // Cette ligne est correcte et nécessaire pour sql`'[]'::jsonb`
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  email: text("email"),
  phone: text("phone"),
  role: text("role").notNull().default("employee"),
  permissions: jsonb("permissions").$type<string[]>().notNull().default(sql`'[]'::jsonb`), // Stocke un tableau JSON vide par défaut
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id),
});

// Table spéciale pour les super administrateurs
export const superAdmins = pgTable("super_admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  imageUrl: text("image_url"),
  available: boolean("available").default(true).notNull(),
  archived: boolean("archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  capacity: integer("capacity").notNull().default(4),
  qrCode: text("qr_code").notNull(),
  status: text("status").notNull().default("available"), // available, occupied, reserved
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").references(() => tables.id),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  status: text("status").notNull().default("pending"), // pending, preparing, ready, completed, cancelled
  paymentMethod: text("payment_method"), // cash, mobile_money
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  deletedAt: timestamp("deleted_at"),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull().default(1),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
});

export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// Table de configuration des onglets système
export const systemTabs = pgTable("system_tabs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  icon: text("icon"),
  isActive: boolean("is_active").default(true),
  order: integer("order").default(0),
  requiredPermissions: text("required_permissions").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Table pour les mises à jour système
export const systemUpdates = pgTable("system_updates", {
  id: serial("id").primaryKey(),
  version: text("version").notNull(),
  description: text("description"),
  changelog: text("changelog"),
  isDeployed: boolean("is_deployed").default(false),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  orderItems: many(orderItems),
}));

export const tablesRelations = relations(tables, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  orderItems: many(orderItems),
  sale: one(sales),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const salesRelations = relations(sales, ({ one }) => ({
  order: one(orders, {
    fields: [sales.orderId],
    references: [orders.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  fullName: z.string().optional(),
  email: z.string().email("Email invalide").nullable().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  phone: z.string().nullable().optional().or(z.literal("")).transform(val => val === "" ? null : val),
  role: z.enum(["admin", "manager", "employee", "cashier"]).default("employee"),
  permissions: z.array(z.string()).optional(),
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
}).extend({
  price: z.union([
    z.string().transform((val) => val),
    z.number().transform((val) => val.toString())
  ])
});

export const insertTableSchema = createInsertSchema(tables).omit({
  id: true,
  createdAt: true,
}).extend({
  qrCode: z.string().optional(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
}).extend({
  total: z.string().optional(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertSaleSchema = createInsertSchema(sales).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([
    z.string().transform((val) => val),
    z.number().transform((val) => val.toString())
  ])
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
}).extend({
  amount: z.union([
    z.string().transform((val) => val),
    z.number().transform((val) => val.toString())
  ])
});

// Schema de validation pour les super admins
export const insertSuperAdminSchema = createInsertSchema(superAdmins).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const insertSystemTabSchema = createInsertSchema(systemTabs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSystemUpdateSchema = createInsertSchema(systemUpdates).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type SuperAdmin = typeof superAdmins.$inferSelect;
export type InsertSuperAdmin = z.infer<typeof insertSuperAdminSchema>;

export type SystemTab = typeof systemTabs.$inferSelect;
export type InsertSystemTab = z.infer<typeof insertSystemTabSchema>;

export type SystemUpdate = typeof systemUpdates.$inferSelect;
export type InsertSystemUpdate = z.infer<typeof insertSystemUpdateSchema>;

export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  category: text("category").default("general"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSystemSettingSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Table = typeof tables.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
