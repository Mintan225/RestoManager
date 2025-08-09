var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import { insertUserSchema, insertCategorySchema, insertProductSchema, insertTableSchema, insertOrderSchema, insertOrderItemSchema, insertSaleSchema } from "@shared-types/schema";
import { DEFAULT_PERMISSIONS } from "@shared-types/permissions";
import { storage } from "./storage";
import { createServer } from "http";
import { APP_CONFIG } from "@shared-types/config";
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
const fileFilter = (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
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
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.log("[AUTH_TOKEN_DEBUG] No token provided.");
        return res.status(401).json({ message: 'Access token required' });
    }
    jwt.verify(token, APP_CONFIG.SECURITY.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("[AUTH_TOKEN_DEBUG] Token verification failed:", err.message);
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired. Please login again.' });
            }
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        console.log("[AUTH_TOKEN_DEBUG] Token decoded successfully. Decoded payload:", decoded);
        req.user = Object.assign(Object.assign({}, decoded), { permissions: Array.isArray(decoded.permissions) ? decoded.permissions : [] });
        console.log("[AUTH_TOKEN_DEBUG] req.user.permissions after processing:", req.user.permissions);
        next();
    });
}
function authorizePermission(requiredPermissions) {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions) {
            return res.status(403).json({ message: 'Access denied: No permissions found for user.' });
        }
        const userPermissions = req.user.permissions;
        const hasPermission = requiredPermissions.some(permission => userPermissions.includes(permission));
        if (hasPermission) {
            next();
        }
        else {
            res.status(403).json({ message: 'Access denied: Insufficient permissions.' });
        }
    };
}
export function registerRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        app.get("/api/health", (req, res) => {
            res.status(200).json({
                status: "healthy",
                timestamp: new Date().toISOString(),
                version: "1.0.0"
            });
        });
        // Users management routes
        app.get("/api/users", authenticateToken, authorizePermission(["users.view"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield storage.getUsers();
                res.json(users);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch users" });
            }
        }));
        app.post("/api/users", authenticateToken, authorizePermission(["users.create"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = insertUserSchema.parse(req.body);
                const hashedPassword = yield bcrypt.hash(userData.password, 10);
                const permissions = (userData.permissions && userData.permissions.length > 0)
                    ? userData.permissions
                    : DEFAULT_PERMISSIONS[userData.role] || [];
                const user = yield storage.createUser(Object.assign(Object.assign({}, userData), { password: hashedPassword, permissions }));
                res.json(user);
            }
            catch (error) {
                console.error("Error creating user:", error);
                res.status(500).json({ message: "Failed to create user", error: error instanceof Error ? error.message : String(error) });
            }
        }));
        app.put("/api/users/:id", authenticateToken, authorizePermission(["users.edit"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = insertUserSchema.partial().parse(req.body);
                if (userData.password) {
                    userData.password = yield bcrypt.hash(userData.password, 10);
                }
                const user = yield storage.updateUser(Number(req.params.id), userData);
                if (!user) {
                    return res.status(404).json({ message: "User not found" });
                }
                res.json(user);
            }
            catch (error) {
                console.error("Error updating user:", error);
                res.status(500).json({ message: "Failed to update user", error: error instanceof Error ? error.message : String(error) });
            }
        }));
        app.delete("/api/users/:id", authenticateToken, authorizePermission(["users.delete"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const success = yield storage.deleteUser(Number(req.params.id));
                if (!success) {
                    return res.status(404).json({ message: "User not found" });
                }
                res.json({ message: "User deleted successfully" });
            }
            catch (error) {
                res.status(500).json({ message: "Failed to delete user" });
            }
        }));
        // Authentication routes
        app.post("/api/auth/register", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { username, password } = req.body;
                const existingUser = yield storage.getUserByUsername(username);
                if (existingUser) {
                    return res.status(400).json({ message: "Username already exists" });
                }
                const hashedPassword = yield bcrypt.hash(password, 10);
                const userData = insertUserSchema.parse({
                    username,
                    password: hashedPassword,
                    fullName: username,
                    role: 'admin',
                    permissions: DEFAULT_PERMISSIONS.admin
                });
                const user = yield storage.createUser(userData);
                const token = jwt.sign({ id: user.id, username: user.username, role: user.role, permissions: user.permissions }, APP_CONFIG.SECURITY.JWT_SECRET, { expiresIn: APP_CONFIG.SECURITY.JWT_EXPIRES_IN });
                res.json({
                    token,
                    user: { id: user.id, username: user.username, role: user.role, permissions: user.permissions }
                });
            }
            catch (error) {
                console.error("Registration error:", error);
                res.status(500).json({ message: "Failed to register user", error: error instanceof Error ? error.message : String(error) });
            }
        }));
        app.post("/api/auth/login", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { username, password } = req.body;
                console.log(`[LOGIN_DEBUG] Attempting login for username: "${username}"`);
                const user = yield storage.getUserByUsername(username);
                if (!user) {
                    console.log(`[LOGIN_DEBUG] Failure: User "${username}" not found.`);
                    return res.status(401).json({ message: "Invalid credentials" });
                }
                console.log(`[LOGIN_DEBUG] User "${username}" found. Hashed password from DB: ${user.password}`);
                const isValidPassword = yield bcrypt.compare(password, user.password);
                if (!isValidPassword) {
                    console.log(`[LOGIN_DEBUG] Failure: Incorrect password for user "${username}".`);
                    return res.status(401).json({ message: "Invalid credentials" });
                }
                const token = jwt.sign({ id: user.id, username: user.username, role: user.role, permissions: user.permissions }, APP_CONFIG.SECURITY.JWT_SECRET, { expiresIn: APP_CONFIG.SECURITY.JWT_EXPIRES_IN });
                console.log(`[LOGIN_DEBUG] Login successful. Token generated.`);
                res.json({
                    token,
                    user: { id: user.id, username: user.username, role: user.role, permissions: user.permissions }
                });
            }
            catch (error) {
                console.error("[LOGIN_DEBUG] Unexpected error during login:", error);
                res.status(500).json({ message: "Failed to login", error: error instanceof Error ? error.message : String(error) });
            }
        }));
        // Categories routes
        app.get("/api/categories", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const categories = yield storage.getCategories();
                res.json(categories);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch categories" });
            }
        }));
        app.post("/api/categories", authenticateToken, authorizePermission(["categories.create"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const categoryData = insertCategorySchema.parse(req.body);
                const category = yield storage.createCategory(categoryData);
                res.json(category);
            }
            catch (error) {
                console.error("Error creating category:", error);
                res.status(500).json({ message: "Failed to create category", error: error instanceof Error ? error.message : String(error) });
            }
        }));
        app.put("/api/categories/:id", authenticateToken, authorizePermission(["categories.edit"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const categoryData = insertCategorySchema.partial().parse(req.body);
                const category = yield storage.updateCategory(Number(req.params.id), categoryData);
                if (!category) {
                    return res.status(404).json({ message: "Category not found" });
                }
                res.json(category);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to update category" });
            }
        }));
        app.delete("/api/categories/:id", authenticateToken, authorizePermission(["categories.delete"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const success = yield storage.deleteCategory(Number(req.params.id));
                if (!success) {
                    return res.status(404).json({ message: "Category not found" });
                }
                res.json({ message: "Category deleted successfully" });
            }
            catch (error) {
                res.status(500).json({ message: "Failed to delete category" });
            }
        }));
        // Products routes
        app.get("/api/products", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { categoryId } = req.query;
                let products;
                if (categoryId) {
                    products = yield storage.getProductsByCategory(Number(categoryId));
                }
                else {
                    products = yield storage.getProducts();
                }
                res.json(products);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch products" });
            }
        }));
        app.get("/api/products/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const product = yield storage.getProduct(Number(req.params.id));
                if (!product) {
                    return res.status(404).json({ message: "Product not found" });
                }
                res.json(product);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch product" });
            }
        }));
        app.post("/api/products", authenticateToken, authorizePermission(["products.create"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const productData = insertProductSchema.parse(req.body);
                const product = yield storage.createProduct(productData);
                res.json(product);
            }
            catch (error) {
                console.error("Error creating product:", error);
                res.status(500).json({ message: "Failed to create product", error: error instanceof Error ? error.message : String(error) });
            }
        }));
        app.put("/api/products/:id", authenticateToken, authorizePermission(["products.edit"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const productData = insertProductSchema.partial().parse(req.body);
                const product = yield storage.updateProduct(Number(req.params.id), productData);
                if (!product) {
                    return res.status(404).json({ message: "Product not found" });
                }
                res.json(product);
            }
            catch (error) {
                console.error("Error updating product:", error);
                res.status(500).json({ message: "Failed to update product", error: error instanceof Error ? error.message : String(error) });
            }
        }));
        app.delete("/api/products/:id", authenticateToken, authorizePermission(["products.delete"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const success = yield storage.deleteProduct(Number(req.params.id));
                if (!success) {
                    return res.status(404).json({ message: "Product not found" });
                }
                res.json({ message: "Product deleted successfully" });
            }
            catch (error) {
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
        }));
        // Image upload endpoint for products
        app.post("/api/products/upload-image", authenticateToken, authorizePermission(["products.create", "products.edit"]), upload.single('image'), (req, res) => __awaiter(this, void 0, void 0, function* () {
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
            }
            catch (error) {
                console.error("Error uploading image:", error);
                res.status(500).json({
                    message: "Failed to upload image",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }));
        // Delete product image endpoint
        app.delete("/api/products/delete-image", authenticateToken, authorizePermission(["products.edit", "products.delete"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { imageUrl } = req.body;
                if (!imageUrl) {
                    return res.status(400).json({ message: "Image URL is required" });
                }
                const filename = path.basename(imageUrl);
                const filepath = path.join(process.cwd(), 'public', 'uploads', 'products', filename);
                const fs = yield import('fs');
                if (fs.existsSync(filepath)) {
                    fs.unlinkSync(filepath);
                    res.json({ message: "Image deleted successfully" });
                }
                else {
                    res.status(404).json({ message: "Image file not found" });
                }
            }
            catch (error) {
                console.error("Error deleting image:", error);
                res.status(500).json({
                    message: "Failed to delete image",
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }));
        // Tables routes
        app.get("/api/tables", authenticateToken, authorizePermission(["tables.view"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const tables = yield storage.getTables();
                res.json(tables);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch tables" });
            }
        }));
        app.get("/api/tables/:id", authenticateToken, authorizePermission(["tables.view"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const table = yield storage.getTable(Number(req.params.id));
                if (!table) {
                    return res.status(404).json({ message: "Table not found" });
                }
                res.json(table);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch table" });
            }
        }));
        app.post("/api/tables", authenticateToken, authorizePermission(["tables.create"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { number, capacity } = req.body;
                const qrCode = `https://${req.headers.host}/table/${number}`;
                const tableData = {
                    number: parseInt(number),
                    capacity: parseInt(capacity),
                    qrCode: qrCode,
                    status: "available"
                };
                const table = yield storage.createTable(tableData);
                res.json(table);
            }
            catch (error) {
                console.error("Error creating table:", error);
                res.status(500).json({ message: "Failed to create table", error: error instanceof Error ? error.message : String(error) });
            }
        }));
        app.put("/api/tables/:id", authenticateToken, authorizePermission(["tables.edit"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const tableData = insertTableSchema.partial().parse(req.body);
                const table = yield storage.updateTable(Number(req.params.id), tableData);
                if (!table) {
                    return res.status(404).json({ message: "Table not found" });
                }
                res.json(table);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to update table" });
            }
        }));
        // Orders routes
        app.get("/api/orders", authenticateToken, authorizePermission(["orders.view"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { active } = req.query;
                let orders;
                if (active === 'true') {
                    orders = yield storage.getActiveOrders();
                }
                else {
                    orders = yield storage.getOrders();
                }
                res.json(orders);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch orders" });
            }
        }));
        app.get("/api/orders/:id", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const order = yield storage.getOrderWithItems(Number(req.params.id));
                if (!order) {
                    return res.status(404).json({ message: "Order not found" });
                }
                res.json(order);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch order" });
            }
        }));
        app.post("/api/orders", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { tableId, customerName, customerPhone, orderItems, paymentMethod, notes } = req.body;
                const total = orderItems.reduce((sum, item) => {
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
                const order = yield storage.createOrder(orderData);
                try {
                    yield storage.updateTable(parseInt(tableId), { status: "occupied" });
                }
                catch (error) {
                    console.error("Error updating table status:", error);
                }
                if (orderItems && orderItems.length > 0) {
                    for (const item of orderItems) {
                        yield storage.createOrderItem({
                            orderId: order.id,
                            productId: parseInt(item.productId),
                            quantity: parseInt(item.quantity),
                            price: item.price.toString(),
                            notes: item.notes || null
                        });
                    }
                }
                const orderWithItems = yield storage.getOrderWithItems(order.id);
                res.json(orderWithItems);
            }
            catch (error) {
                console.error("Error creating order:", error);
                res.status(500).json({ message: "Failed to create order", error: error instanceof Error ? error.message : String(error) });
            }
        }));
        app.put("/api/orders/:id", authenticateToken, authorizePermission(["orders.edit", "orders.update_status"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const orderData = insertOrderSchema.partial().parse(req.body);
                if (orderData.status === 'completed') {
                    orderData.paymentStatus = 'paid';
                    orderData.completedAt = new Date();
                }
                const order = yield storage.updateOrder(Number(req.params.id), orderData);
                if (!order) {
                    return res.status(404).json({ message: "Order not found" });
                }
                if (orderData.status) {
                    try {
                        let tableStatus = "available";
                        if (orderData.status === 'completed' || orderData.status === 'cancelled') {
                            const activeOrders = yield storage.getActiveOrders();
                            const otherActiveOrders = activeOrders.filter((o) => o.tableId === order.tableId &&
                                o.id !== order.id &&
                                o.status !== 'completed' &&
                                o.status !== 'cancelled');
                            if (otherActiveOrders.length === 0) {
                                tableStatus = "available";
                            }
                            else {
                                tableStatus = "occupied";
                            }
                        }
                        else {
                            tableStatus = "occupied";
                        }
                        yield storage.updateTable(order.tableId, { status: tableStatus });
                    }
                    catch (error) {
                        console.error("Error updating table status:", error);
                    }
                }
                if (orderData.status === 'completed' && orderData.paymentStatus === 'paid') {
                    try {
                        const orderWithItems = yield storage.getOrderWithItems(order.id);
                        if (orderWithItems) {
                            const existingSales = yield storage.getSales();
                            const existingSale = existingSales.find(sale => sale.orderId === order.id);
                            if (!existingSale) {
                                yield storage.createSale({
                                    orderId: order.id,
                                    amount: order.total,
                                    paymentMethod: order.paymentMethod || 'cash',
                                    description: `Commande #${order.id} - ${orderWithItems.orderItems.map(item => item.product.name).join(', ')}`
                                });
                                console.log(`Vente automatiquement créée pour la commande #${order.id}`);
                            }
                            else {
                                console.log(`Vente déjà existante pour la commande #${order.id}`);
                            }
                        }
                    }
                    catch (saleError) {
                        console.error('Error creating sale for completed order:', saleError);
                    }
                }
                res.json(order);
            }
            catch (error) {
                console.error("Error updating order:", error);
                res.status(500).json({ message: "Failed to update order" });
            }
        }));
        app.get("/api/orders/:id/receipt", (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const orderId = Number(req.params.id);
                const orderWithItems = yield storage.getOrderWithItems(orderId);
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
                    items: orderWithItems.orderItems.map((item) => ({
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
            }
            catch (error) {
                console.error("Error generating receipt:", error);
                res.status(500).json({ message: "Failed to generate receipt" });
            }
        }));
        // Order Items routes
        app.post("/api/order-items", authenticateToken, authorizePermission(["orders.create"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const orderItemData = insertOrderItemSchema.parse(req.body);
                const orderItem = yield storage.createOrderItem(orderItemData);
                res.json(orderItem);
            }
            catch (error) {
                console.error("Error creating order item:", error);
                res.status(500).json({ message: "Failed to create order item", error: error instanceof Error ? error.message : String(error) });
            }
        }));
        // Sales routes
        app.get("/api/sales", authenticateToken, authorizePermission(["sales.view"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const sales = yield storage.getSales();
                res.json(sales);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch sales" });
            }
        }));
        app.post("/api/sales", authenticateToken, authorizePermission(["sales.create"]), (req, res) => __awaiter(this, void 0, void 0, function* () {
            try {
                const saleData = insertSaleSchema.parse(req.body);
                const sale = yield storage.createSale(saleData);
                res.status(201).json(sale);
            }
            catch (error) {
                console.error("Error creating sale:", error);
                res.status(500).json({ message: "Failed to create sale", error: error instanceof Error ? error.message : String(error) });
            }
        }));
        return createServer(app);
    });
}
