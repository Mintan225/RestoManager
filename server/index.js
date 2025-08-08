var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import "dotenv/config";
import express from "express";
import { registerRoutes } from "./routes";
// Correction: Importation de la fonction 'log' qui est maintenant exportée du fichier 'vite.ts'
import { setupVite, serveStatic, log } from "./vite";
import { createDefaultSuperAdmin } from "./super-admin-init";
import { storage } from "./storage";
import { DEFAULT_PERMISSIONS } from "@shared/permissions";
import path from "path";
import { execSync } from "child_process";
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'public/uploads')));
app.use((req, res, next) => {
    const start = Date.now();
    const pathReq = req.path;
    let capturedJsonResponse;
    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
        capturedJsonResponse = bodyJson;
        return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (pathReq.startsWith("/api")) {
            let logLine = `${req.method} ${pathReq} ${res.statusCode} in ${duration}ms`;
            if (capturedJsonResponse) {
                logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
            }
            if (logLine.length > 80) {
                logLine = logLine.slice(0, 79) + "…";
            }
            // Utilisation de la fonction 'log' importée
            log(logLine);
        }
    });
    next();
});
function createDefaultAdmin() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const existingAdmin = yield storage.getUserByUsername("admin");
            if (!existingAdmin) {
                yield storage.createUser({
                    username: "admin",
                    password: "admin123",
                    role: "admin",
                    permissions: DEFAULT_PERMISSIONS.admin
                });
                // Utilisation de la fonction 'log' importée
                log("✓ Default admin user created: admin / admin123");
            }
        }
        catch (error) {
            // Utilisation de console.error pour une meilleure gestion des erreurs
            console.error("Error creating default admin: " + error.message);
        }
    });
}
function initializeSystemSettings() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const appNameSetting = yield storage.getSystemSetting("app_name");
            if (!appNameSetting) {
                yield storage.createSystemSetting({
                    key: "app_name",
                    value: "Restaurant Manager",
                    description: "Nom personnalisé de l'application",
                    category: "branding"
                });
                // Utilisation de la fonction 'log' importée
                log("✓ System setting app_name initialized");
            }
        }
        catch (error) {
            // Utilisation de console.error pour une meilleure gestion des erreurs
            console.error("Error initializing system settings: " + error.message);
        }
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    // --- Run migrations at startup ---
    try {
        console.log("🏗️ Running database migrations (push:pg)...");
        execSync("npx drizzle-kit push", { stdio: "inherit" });
        console.log("✅ Migrations applied.");
    }
    catch (e) {
        console.error("🚨 Migration failed:", e);
    }
    // Create default admin and super admin
    yield createDefaultAdmin();
    yield createDefaultSuperAdmin();
    yield initializeSystemSettings();
    const server = yield registerRoutes(app);
    app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        // Utilisation de console.error et non pas de throw, qui ferait planter le serveur
        console.error("Caught error:", err);
    });
    if (app.get("env") === "development") {
        yield setupVite(app, server);
    }
    else {
        serveStatic(app);
    }
    const port = 5000;
    server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
        // Utilisation de la fonction 'log' importée
        log(`serving on port ${port}`);
    });
}))();
