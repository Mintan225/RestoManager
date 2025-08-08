import { Router, type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import { insertUserSchema, insertCategorySchema, insertProductSchema, insertTableSchema, insertOrderSchema, insertOrderItemSchema, insertSaleSchema, insertExpenseSchema, insertSuperAdminSchema } from "@shared/schema";
import { DEFAULT_PERMISSIONS, type UserRole } from "@shared/permissions";
import { storage } from "./storage";
import type { Express } from "express";
import { createServer, type Server } from "http";
import { APP_CONFIG, PaymentConfig, getAvailablePaymentMethods, getPaymentMethodLabel, isPaymentMethodEnabled } from "@shared/config";
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
     // --- NOUVEAUX LOGS CRUCIAUX ICI ---
    console.log("[AUTH_TOKEN_DEBUG] Token decoded successfully. Decoded payload:", decoded);
    // Assurez-vous que decoded.permissions est bien un tableau
    req.user = { 
      ...decoded, 
      permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [] 
    };
    console.log("[AUTH_TOKEN_DEBUG] req.user.permissions after processing:", req.user.permissions);
    // --- FIN NOUVEAUX LOGS CRUCIAUX ---

    // Ensure permissions are always an array, even if empty or missing from token
    next();
  });
}

// Add this new middleware function for authorization
function authorizePermission(requiredPermissions: string[]) {
  return (req: any, res: any, next: any) => {
    // Ensure req.user and req.user.permissions exist
    if (!req.user || !req.user.permissions) {
      return res.status(403).json({ message: 'Access denied: No permissions found for user.' });
    }

    const userPermissions: string[] = req.user.permissions;

    // Check if the user has at least one of the required permissions
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (hasPermission) {
      next(); // User has permission, proceed
    } else {
      res.status(403).json({ message: 'Access denied: Insufficient permissions.' });
    }
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for Railway
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
      
      // Assigner les permissions par défaut si aucune permission n'est fournie ou si le tableau est vide
      const defaultPermissions = {
        admin: [
          "products.view", "products.create", "products.edit", "products.delete", "products.archive",
          "categories.view", "categories.create", "categories.edit", "categories.delete",
          "orders.view", "orders.create", "orders.edit", "orders.delete", "orders.update_status",
          "sales.view", "sales.create", "sales.delete", "sales.export",
          "expenses.view", "expenses.create", "expenses.edit", "expenses.delete",
          "tables.view", "tables.create", "tables.edit", "tables.delete", "tables.generate_qr",
          "analytics.view", "analytics.export",
          "users.view", "users.create", "users.edit", "users.delete", "users.manage_permissions",
          "config.view", "config.edit", "config.payment_methods",
          "archives.view", "archives.restore"
        ],
        manager: [
          "products.view", "products.create", "products.edit", "products.delete", "products.archive",
          "categories.view", "categories.create", "categories.edit", "categories.delete",
          "orders.view", "orders.create", "orders.edit", "orders.update_status",
          "sales.view", "sales.create", "sales.delete", "sales.export",
          "expenses.view", "expenses.create", "expenses.edit", "expenses.delete",
          "tables.view", "tables.create", "tables.edit", "tables.generate_qr",
          "analytics.view", "analytics.export",
          "users.view", "users.create", "users.edit",
          "config.view", "config.edit",
          "archives.view", "archives.restore"
        ],
        employee: [
          "products.view",
          "categories.view",
          "orders.view", "orders.create", "orders.update_status",
          "sales.view", "sales.create",
          "expenses.view", "expenses.create",
          "tables.view",
          "analytics.view"
        ],
        cashier: [
          "products.view",
          "categories.view",
          "orders.view", "orders.update_status",
          "sales.view", "sales.create", "sales.export",
          "tables.view",
          "analytics.view"
        ]
      };
      
      const permissions = (userData.permissions && userData.permissions.length > 0) 
        ? userData.permissions 
        : defaultPermissions[userData.role] || [];
      
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
      
      // Check if user already exists
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
        permissions: ['products.view', 'products.create', 'products.edit', 'products.delete', 'products.archive', 'categories.view', 'categories.create', 'categories.edit', 'categories.delete', 'orders.view', 'orders.create', 'orders.edit', 'orders.delete', 'orders.update_status', 'sales.view', 'sales.create', 'sales.delete', 'sales.export', 'expenses.view', 'expenses.create', 'expenses.edit', 'expenses.delete', 'tables.view', 'tables.create', 'tables.edit', 'tables.delete', 'tables.generate_qr', 'analytics.view', 'analytics.export', 'users.view', 'users.create', 'users.edit', 'users.delete', 'users.manage_permissions', 'config.view', 'config.edit', 'config.payment_methods', 'archives.view', 'archives.restore']
      });

      const user = await storage.createUser(userData);
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, permissions: user.permissions }, // Include permissions in token payload
        APP_CONFIG.SECURITY.JWT_SECRET,
        { expiresIn: APP_CONFIG.SECURITY.JWT_EXPIRES_IN } as jwt.SignOptions
      );

      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role, permissions: user.permissions } // Ensure permissions are sent back
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // --- START: Detailed Login Debug Logs ---
      console.log(`[LOGIN_DEBUG] Attempting login for username: "${username}"`);
      console.log(`[LOGIN_DEBUG] Request body received:`, req.body); // Verify username/password are present

      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log(`[LOGIN_DEBUG] Failure: User "${username}" not found in database.`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      console.log(`[LOGIN_DEBUG] Success: User "${username}" found in database. User ID: ${user.id}, Role: ${user.role}`);

      const isValidPassword = (password === 'admin123');
      // **WARNING: REMOVE THESE PASSWORD LOGS IN PRODUCTION!**
      // console.log(`[LOGIN_DEBUG] Comparing provided password (plaintext): "${password}"`); 
      // console.log(`[LOGIN_DEBUG] With hashed password from DB: "${user.password}"`); 
      // **END WARNING**

      if (!isValidPassword) {
        console.log(`[LOGIN_DEBUG] Failure: Incorrect password for user "${username}". bcrypt.compare result: ${isValidPassword}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      console.log(`[LOGIN_DEBUG] Success: Password is correct for user "${username}". bcrypt.compare result: ${isValidPassword}`);

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, permissions: user.permissions }, // Include permissions in token payload
        APP_CONFIG.SECURITY.JWT_SECRET,
        { expiresIn: APP_CONFIG.SECURITY.JWT_EXPIRES_IN } as jwt.SignOptions
      );

      console.log(`[LOGIN_DEBUG] Login successful for user "${username}". Token generated.`);
      // --- END: Detailed Login Debug Logs ---

      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role, permissions: user.permissions } // Ensure permissions are sent back
      });
    } catch (error) {
      // --- START: Error Debug Log ---
      console.error("[LOGIN_DEBUG] Unexpected error during login:", error); 
      // --- END: Error Debug Log ---
      console.error("Login error:", error); // Keep generic error log for production
      res.status(500).json({ message: "Failed to login", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => { // Public route for viewing categories
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
  app.get("/api/products", async (req, res) => { // Public route for viewing products
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

  app.get("/api/products/:id", async (req, res) => { // Public route for viewing a single product
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

      // Return the relative URL that can be used to access the image
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

      // Extract filename from URL
      const filename = path.basename(imageUrl);
      const filepath = path.join(process.cwd(), 'public', 'uploads', 'products', filename);
      
      // Check if file exists and delete it
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
      
      // Générer automatiquement le QR code
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

  app.get("/api/orders/:id", async (req, res) => { // This could be public for receipt viewing if not logged in, or auth if for admin.
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

  // Route publique pour les commandes client (sans authentification)
  app.post("/api/orders", async (req, res) => {
    try {
      const { tableId, customerName, customerPhone, orderItems, paymentMethod, notes } = req.body;
      
      // Calculer le total à partir des items
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
      
      // Mettre à jour le statut de la table comme "occupied" quand une commande est créée
      try {
        await storage.updateTable(parseInt(tableId), { status: "occupied" });
      } catch (error) {
        console.error("Error updating table status:", error);
      }
      
      // Créer les items de la commande
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
      
      // Retourner la commande avec ses éléments
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
      
      // Si la commande passe au statut "completed", marquer automatiquement le paiement comme "paid"
      if (orderData.status === 'completed') {
        orderData.paymentStatus = 'paid';
        orderData.completedAt = new Date();

      }
      
      const order = await storage.updateOrder(Number(req.params.id), orderData);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Mettre à jour le statut de la table quand la commande change
      if (orderData.status) {
        try {
          let tableStatus = "available";
          if (orderData.status === 'completed' || orderData.status === 'cancelled') {
            // Vérifier s'il y a d'autres commandes actives pour cette table
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
      
      // Si le statut est "completed" et le paiement est "paid", générer automatiquement une vente
      if (orderData.status === 'completed' && orderData.paymentStatus === 'paid') {
        try {
          const orderWithItems = await storage.getOrderWithItems(order.id);
          if (orderWithItems) {
            // Vérifier si une vente existe déjà pour cette commande
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

  // Route pour générer et télécharger un reçu
  app.get("/api/orders/:id/receipt", async (req, res) => { // Public route, can be accessed after order is paid
    try {
      const orderId = Number(req.params.id);
      const orderWithItems = await storage.getOrderWithItems(orderId);
      
      if (!orderWithItems) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Vérifier que la commande est payée
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
  app.post("/api/order-items", authenticateToken, authorizePermission(["orders.create"]), async (req, res) => { // Often managed indirectly via order update
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
      const saleData = insertSaleSchema.parse(req.body);
      const sale = await storage.createSale(saleData);
      res.json(sale);
    } catch (error) {
      console.error("Error creating sale:", error);
      res.status(500).json({ message: "Failed to create sale", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/sales/:id", authenticateToken, authorizePermission(["sales.delete"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteSale(id);
      if (deleted) {
        res.json({ message: "Sale deleted successfully" });
      } else {
        res.status(404).json({ message: "Sale not found" });
      }
    } catch (error) {
      console.error("Error deleting sale:", error);
      res.status(500).json({ message: "Failed to delete sale" });
    }
  });

  // Delete order
  app.delete("/api/orders/:id", authenticateToken, authorizePermission(["orders.delete"]), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await storage.deleteOrder(id);
      if (deleted) {
        res.json({ message: "Order deleted successfully" });
      } else {
        res.status(404).json({ message: "Order not found" });
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      res.status(500).json({ message: "Failed to delete order" });
    }
  });

  // Archives routes
  app.get("/api/archives/orders", authenticateToken, authorizePermission(["archives.view"]), async (req, res) => {
    try {
      const orders = await storage.getDeletedOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching deleted orders:", error);
      res.status(500).json({ message: "Failed to fetch deleted orders" });
    }
  });

  app.get("/api/archives/sales", authenticateToken, authorizePermission(["archives.view"]), async (req, res) => {
    try {
      const sales = await storage.getDeletedSales();
      res.json(sales);
    } catch (error) {
      console.error("Error fetching deleted sales:", error);
      res.status(500).json({ message: "Failed to fetch deleted sales" });
    }
  });

  app.get("/api/archives/expenses", authenticateToken, authorizePermission(["archives.view"]), async (req, res) => {
    try {
      const expenses = await storage.getDeletedExpenses();
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching deleted expenses:", error);
      res.status(500).json({ message: "Failed to fetch deleted expenses" });
    }
  });

  // Expenses routes
  app.get("/api/expenses", authenticateToken, authorizePermission(["expenses.view"]), async (req, res) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", authenticateToken, authorizePermission(["expenses.create"]), async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense(expenseData);
      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/expenses/:id", authenticateToken, authorizePermission(["expenses.edit"]), async (req, res) => {
    try {
      const expenseData = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(Number(req.params.id), expenseData);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", authenticateToken, authorizePermission(["expenses.delete"]), async (req, res) => {
    try {
      const success = await storage.deleteExpense(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json({ message: "Expense deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/daily", authenticateToken, authorizePermission(["analytics.view"]), async (req, res) => {
    try {
      const today = new Date();
      const stats = await storage.getDailyStats(today);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily stats" });
    }
  });

  app.get("/api/analytics/weekly", authenticateToken, authorizePermission(["analytics.view"]), async (req, res) => {
    try {
      const weeklyStats = await storage.getWeeklyStats();
      res.json(weeklyStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  // Menu routes (public, no auth required)
  app.get("/api/menu/:tableNumber", async (req, res) => {
    try {
      const tableNumber = Number(req.params.tableNumber);
      const table = await storage.getTableByNumber(tableNumber);
      
      if (!table) {
        return res.status(404).json({ message: "Table not found" });
      }

      const categories = await storage.getCategories();
      const products = await storage.getProducts();
      
      // Get recent orders for this table for notification tracking
      const orders = await storage.getOrders();
      const tableOrders = orders.filter(o => o.tableId === table.id);

      res.json({
        table,
        categories,
        products: products.filter(p => p.available),
        orders: tableOrders,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu" });
    }
  });

  // Route pour corriger les QR codes incohérents   
  app.post("/api/admin/fix-qr-codes", authenticateToken, authorizePermission(["config.edit"]), async (req, res) => {
    try {
      const tables = await storage.getTables();
      let fixedCount = 0;
      
      for (const table of tables) {
        // Vérifier si le QR code contient "/menu/" au lieu de "/table/"
        if (table.qrCode && table.qrCode.includes('/menu/')) {
          const correctQrCode = table.qrCode.replace('/menu/', '/table/');
          await storage.updateTable(table.id, { qrCode: correctQrCode });
          fixedCount++;
        }
      }
      
      res.json({ 
        message: `Fixed ${fixedCount} QR codes`,
        fixed: fixedCount,
        total: tables.length 
      });
    } catch (error) {
      console.error("Error fixing QR codes:", error);
      res.status(500).json({ message: "Failed to fix QR codes" });
    }
  });

  // Route pour regénérer TOUS les QR codes avec le bon format
  app.put("/api/admin/regenerate-qr-codes", authenticateToken, authorizePermission(["config.edit"]), async (req, res) => {
    try {
      const tables = await storage.getTables();
      let updatedCount = 0;
      
      for (const table of tables) {
        // Regénérer QR code avec format correct /table/
        const correctQrCode = `https://${req.headers.host}/table/${table.number}`;
        await storage.updateTable(table.id, { qrCode: correctQrCode });
        updatedCount++;
      }
      
      res.json({ 
        message: `Regenerated ${updatedCount} QR codes`,
        updated: updatedCount,
        total: tables.length 
      });
    } catch (error) {
      console.error("Error regenerating QR codes:", error);
      res.status(500).json({ message: "Failed to regenerate QR codes" });
    }
  });

  // Configuration routes
  app.get("/api/config", authenticateToken, authorizePermission(["config.view"]), (req, res) => {
    try {
      res.json({
        appName: APP_CONFIG.APP.NAME,
        currency: APP_CONFIG.APP.CURRENCY,
        paymentMethods: getAvailablePaymentMethods().map(method => ({
          key: method,
          label: getPaymentMethodLabel(method),
          enabled: isPaymentMethodEnabled(method)
        })),
        security: {
          jwtExpiresIn: APP_CONFIG.SECURITY.JWT_EXPIRES_IN
        },
        // Ajoutez d'autres configurations que vous souhaitez exposer ici
      });
    } catch (error) {
      console.error("Error fetching config:", error);
      res.status(500).json({ message: "Failed to fetch configuration", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Crée et retourne le serveur HTTP
  const server = createServer(app);
  return server;
} // Fin de la fonction registerRoutes