import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
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
    let capturedJsonResponse: Record<string, any> | undefined;

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

async function createDefaultAdmin() {
    try {
        const existingAdmin = await storage.getUserByUsername("admin");
        if (!existingAdmin) {
            await storage.createUser({
                username: "admin",
                password: "admin123",
                role: "admin",
                permissions: DEFAULT_PERMISSIONS.admin
            });
            // Utilisation de la fonction 'log' importée
            log("✓ Default admin user created: admin / admin123");
        }
    } catch (error) {
        // Utilisation de console.error pour une meilleure gestion des erreurs
        console.error("Error creating default admin: " + (error as Error).message);
    }
}

async function initializeSystemSettings() {
    try {
        const appNameSetting = await storage.getSystemSetting("app_name");
        if (!appNameSetting) {
            await storage.createSystemSetting({
                key: "app_name",
                value: "Restaurant Manager",
                description: "Nom personnalisé de l'application",
                category: "branding"
            });
            // Utilisation de la fonction 'log' importée
            log("✓ System setting app_name initialized");
        }
    } catch (error) {
        // Utilisation de console.error pour une meilleure gestion des erreurs
        console.error("Error initializing system settings: " + (error as Error).message);
    }
}

(async () => {
    // --- Run migrations at startup ---
    try {
        console.log("🏗️ Running database migrations (push:pg)...");
        execSync("npx drizzle-kit push", { stdio: "inherit" });
        console.log("✅ Migrations applied.");
    } catch (e) {
        console.error("🚨 Migration failed:", e);
    }

    // Create default admin and super admin
    await createDefaultAdmin();
    await createDefaultSuperAdmin();
    await initializeSystemSettings();

    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
        // Utilisation de console.error et non pas de throw, qui ferait planter le serveur
        console.error("Caught error:", err);
    });

    if (app.get("env") === "development") {
        await setupVite(app, server);
    } else {
        serveStatic(app);
    }

    const port = 5000;
    server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
        // Utilisation de la fonction 'log' importée
        log(`serving on port ${port}`);
    });
})();
