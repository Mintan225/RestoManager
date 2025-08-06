// server/routes.ts
import { Router, type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import { insertUserSchema, insertCategorySchema, insertProductSchema, insertTableSchema, insertOrderSchema, insertOrderItemSchema, insertSaleSchema, insertExpenseSchema, insertSuperAdminSchema } from "../shared-types/schema";
import { DEFAULT_PERMISSIONS } from "./permissions"; // Importation corrigée
import { storage } from "./storage";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { APP_CONFIG, PaymentConfig, getAvailablePaymentMethods, getPaymentMethodLabel, isPaymentMethodEnabled } from "../shared-types/config";
import { PaymentService } from "./payment-service";

// Configure multer for image uploads
const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/products');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept only images
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage_multer,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log("[AUTH_TOKEN_DEBUG] No token provided.");
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, APP_CONFIG.SECURITY.JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      console.log("[AUTH_TOKEN_DEBUG] Token verification failed:", err.message);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired. Please login again.' });
      }
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    console.log("[AUTH_TOKEN_DEBUG] Token decoded successfully. Decoded payload:", decoded);
    req.user = { 
      ...decoded, 
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [] 
    };
    console.log("[AUTH_TOKEN_DEBUG] req.user.permissions after processing:", req.user.permissions);
    next();
  });
}

function authorizePermission(requiredPermissions: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ message: 'Access denied: No permissions found for user.' });
    }

    const userPermissions: string[] = req.user.permissions;
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (hasPermission) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied: Insufficient permissions.' });
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // Users management routes
  app.get("/api/users", authenticateToken, authorizePermission(["users.view"]), async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", authenticateToken, authorizePermission(["users.create"]), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const permissions = (userData.permissions && userData.permissions.length > 0) 
        ? userData.permissions 
        : DEFAULT_PERMISSIONS[userData.role] || [];
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        permissions,
      });
      res.json(user);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/users/:id", authenticateToken, authorizePermission(["users.edit"]), async (req, res) => {
    try {
      const userData = insertUserSchema.partial().parse(req.body);
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      const user = await storage.updateUser(Number(req.params.id), userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/users/:id", authenticateToken, authorizePermission(["users.delete"]), async (req, res) => {
    try {
      const success = await storage.deleteUser(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const userData = insertUserSchema.parse({
        username,
        password: hashedPassword,
        fullName: username,
        role: 'admin',
        permissions: DEFAULT_PERMISSIONS.admin
      });
      const user = await storage.createUser(userData);
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, permissions: user.permissions },
        APP_CONFIG.SECURITY.JWT_SECRET,
        { expiresIn: APP_CONFIG.SECURITY.JWT_EXPIRES_IN } as jwt.SignOptions
      );
      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role, permissions: user.permissions }
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log(`[LOGIN_DEBUG] Attempting login for username: "${username}"`);
      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`[LOGIN_DEBUG] Failure: User "${username}" not found.`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      console.log(`[LOGIN_DEBUG] User "${username}" found. Hashed password from DB: ${user.password}`);
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        console.log(`[LOGIN_DEBUG] Failure: Incorrect password for user "${username}".`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, permissions: user.permissions },
        APP_CONFIG.SECURITY.JWT_SECRET,
        { expiresIn: APP_CONFIG.SECURITY.JWT_EXPIRES_IN } as jwt.SignOptions
      );
      console.log(`[LOGIN_DEBUG] Login successful. Token generated.`);
      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role, permissions: user.permissions }
      });
    } catch (error) {
      console.error("[LOGIN_DEBUG] Unexpected error during login:", error); 
      res.status(500).json({ message: "Failed to login", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", authenticateToken, authorizePermission(["categories.create"]), async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/categories/:id", authenticateToken, authorizePermission(["categories.edit"]), async (req, res) => {
    try {
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(Number(req.params.id), categoryData);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", authenticateToken, authorizePermission(["categories.delete"]), async (req, res) => {
    try {
      const success = await storage.deleteCategory(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const { categoryId } = req.query;
      let products;
      if (categoryId) {
        products = await storage.getProductsByCategory(Number(categoryId));
      } else {
        products = await storage.getProducts();
      }
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(Number(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", authenticateToken, authorizePermission(["products.create"]), async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ message: "Failed to create product", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/products/:id", authenticateToken, authorizePermission(["products.edit"]), async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(Number(req.params.id), productData);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      res.status(500).json({ message: "Failed to update product", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/products/:id", authenticateToken, authorizePermission(["products.delete"]), async (req, res) => {
    try {
      const success = await storage.deleteProduct(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error deleting product:", error);
      if (error instanceof Error && error.message.includes("used in orders")) {
        return res.status(400).json({ 
          message: "Cannot delete product that is used in orders",
          error: error.message 
        });
      }
      res.status(500).json({ 
        message: "Failed to delete product", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Image upload endpoint for products
  app.post("/api/products/upload-image", authenticateToken, authorizePermission(["products.create", "products.edit"]), upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      const imageUrl = `/uploads/products/${req.file.filename}`;
      res.json({
        message: "Image uploaded successfully",
        imageUrl: imageUrl,
        filename: req.file.filename
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ 
        message: "Failed to upload image", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Delete product image endpoint
  app.delete("/api/products/delete-image", authenticateToken, authorizePermission(["products.edit", "products.delete"]), async (req, res) => {
    try {
      const { imageUrl } = req.body;
      if (!imageUrl) {
        return res.status(400).json({ message: "Image URL is required" });
      }
      const filename = path.basename(imageUrl);
      const filepath = path.join(process.cwd(), 'public', 'uploads', 'products', filename);
      const fs = await import('fs');
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        res.json({ message: "Image deleted successfully" });
      } else {
        res.status(404).json({ message: "Image file not found" });
      }
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ 
        message: "Failed to delete image", 
        error: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Tables routes
  app.get("/api/tables", authenticateToken, authorizePermission(["tables.view"]), async (req, res) => {
    try {
      const tables = await storage.getTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tables" });
    }
  });

  app.get("/api/tables/:id", authenticateToken, authorizePermission(["tables.view"]), async (req, res) => {
    try {
      const table = await storage.getTable(Number(req.params.id));
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      res.json(table);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch table" });
    }
  });

  app.post("/api/tables", authenticateToken, authorizePermission(["tables.create"]), async (req, res) => {
    try {
      const { number, capacity } = req.body;
      const qrCode = `https://${req.headers.host}/table/${number}`;
      const tableData = {
        number: parseInt(number),
        capacity: parseInt(capacity),
        qrCode: qrCode,
        status: "available"
      };
      const table = await storage.createTable(tableData);
      res.json(table);
    } catch (error) {
      console.error("Error creating table:", error);
      res.status(500).json({ message: "Failed to create table", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/tables/:id", authenticateToken, authorizePermission(["tables.edit"]), async (req, res) => {
    try {
      const tableData = insertTableSchema.partial().parse(req.body);
      const table = await storage.updateTable(Number(req.params.id), tableData);
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }
      res.json(table);
    } catch (error) {
      res.status(500).json({ message: "Failed to update table" });
    }
  });

  // Orders routes
  app.get("/api/orders", authenticateToken, authorizePermission(["orders.view"]), async (req, res) => {
    try {
      const { active } = req.query;
      let orders;
      if (active === 'true') {
        orders = await storage.getActiveOrders();
      } else {
        orders = await storage.getOrders();
      }
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrderWithItems(Number(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const { tableId, customerName, customerPhone, orderItems, paymentMethod, notes } = req.body;
      const total = orderItems.reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.price) * item.quantity);
      }, 0);
      const orderData = {
        tableId: parseInt(tableId),
        customerName,
        customerPhone,
        paymentMethod: paymentMethod || "cash",
        total: total.toString(),
        notes: notes || null,
        status: "pending",
        paymentStatus: "pending"
      };
      const order = await storage.createOrder(orderData);
      try {
        await storage.updateTable(parseInt(tableId), { status: "occupied" });
      } catch (error) {
        console.error("Error updating table status:", error);
      }
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          await storage.createOrderItem({
            orderId: order.id,
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
            price: item.price.toString(),
            notes: item.notes || null
          });
        }
      }
      const orderWithItems = await storage.getOrderWithItems(order.id);
      res.json(orderWithItems);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/orders/:id", authenticateToken, authorizePermission(["orders.edit", "orders.update_status"]), async (req, res) => {
    try {
      const orderData = insertOrderSchema.partial().parse(req.body);
      if (orderData.status === 'completed') {
        orderData.paymentStatus = 'paid';
        orderData.completedAt = new Date();
      }
      const order = await storage.updateOrder(Number(req.params.id), orderData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (orderData.status) {
        try {
          let tableStatus = "available";
          if (orderData.status === 'completed' || orderData.status === 'cancelled') {
            const activeOrders = await storage.getActiveOrders();
            const otherActiveOrders = activeOrders.filter((o: any) => 
              o.tableId === order.tableId && 
              o.id !== order.id && 
              o.status !== 'completed' && 
              o.status !== 'cancelled'
            );
            if (otherActiveOrders.length === 0) {
              tableStatus = "available";
            } else {
              tableStatus = "occupied";
            }
          } else {
            tableStatus = "occupied";
          }
          await storage.updateTable(order.tableId, { status: tableStatus });
        } catch (error) {
          console.error("Error updating table status:", error);
        }
      }
      if (orderData.status === 'completed' && orderData.paymentStatus === 'paid') {
        try {
          const orderWithItems = await storage.getOrderWithItems(order.id);
          if (orderWithItems) {
            const existingSales = await storage.getSales();
            const existingSale = existingSales.find(sale => sale.orderId === order.id);
            if (!existingSale) {
              await storage.createSale({
                orderId: order.id,
                amount: order.total,
                paymentMethod: order.paymentMethod || 'cash',
                description: `Commande #${order.id} - ${orderWithItems.orderItems.map(item => item.product.name).join(', ')}`
              });
              console.log(`Vente automatiquement créée pour la commande #${order.id}`);
            } else {
              console.log(`Vente déjà existante pour la commande #${order.id}`);
            }
          }
        } catch (saleError) {
          console.error('Error creating sale for completed order:', saleError);
        }
      }
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.get("/api/orders/:id/receipt", async (req, res) => {
    try {
      const orderId = Number(req.params.id);
      const orderWithItems = await storage.getOrderWithItems(orderId);
      if (!orderWithItems) {
        return res.status(404).json({ message: "Order not found" });
      }
      if (orderWithItems.paymentStatus !== 'paid') {
        return res.status(400).json({ message: "Order is not paid yet" });
      }
      const receiptData = {
        orderId: orderWithItems.id,
        customerName: orderWithItems.customerName || 'Client',
        customerPhone: orderWithItems.customerPhone,
        tableNumber: orderWithItems.tableId,
        items: orderWithItems.orderItems.map((item: any) => ({
          name: item.product.name,
          quantity: item.quantity,
          price: parseFloat(item.price),
          total: parseFloat(item.price) * item.quantity
        })),
        subtotal: parseFloat(orderWithItems.total),
        total: parseFloat(orderWithItems.total),
        paymentMethod: orderWithItems.paymentMethod || 'Espèces',
        paymentDate: orderWithItems.createdAt,
        restaurantName: 'Mon Restaurant',
        restaurantAddress: 'Adresse du restaurant',
        restaurantPhone: '+225 XX XX XX XX'
      };
      res.json(receiptData);
    } catch (error) {
      console.error("Error generating receipt:", error);
      res.status(500).json({ message: "Failed to generate receipt" });
    }
  });

  // Order Items routes
  app.post("/api/order-items", authenticateToken, authorizePermission(["orders.create"]), async (req, res) => {
    try {
      const orderItemData = insertOrderItemSchema.parse(req.body);
      const orderItem = await storage.createOrderItem(orderItemData);
      res.json(orderItem);
    } catch (error) {
      console.error("Error creating order item:", error);
      res.status(500).json({ message: "Failed to create order item", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Sales routes
  app.get("/api/sales", authenticateToken, authorizePermission(["sales.view"]), async (req, res) => {
    try {
      const sales = await storage.getSales();
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", authenticateToken, authorizePermission(["sales.create"]), async (req, res) => {
    try {
      const saleData = insertSaleSchema.parse(req.body)
    }