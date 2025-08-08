import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createDefaultSuperAdmin } from "./super-admin-init";
import { storage } from "./storage";
import { DEFAULT_PERMISSIONS } from "@shared-types/permissions";
import * as schema from "@shared-types/schema";
import { methodLabel } from "@shared-types/config";
import path from "path";
import { execSync } from "child_process";
import { log } from "./utils/logger";
import { setupVite, serveStatic } from "./utils/dev-utils";

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
  // Correction 1 : Utilisation de `this` dans la fonction pour préserver le contexte d'Express
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(this, [bodyJson, ...args]);
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
      log(logLine);
    }
  });

  next();
});

async function createDefaultAdmin() {
  try {
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      // Correction 2 : Ne pas utiliser de mot de passe en dur.
      // Un mot de passe par défaut est une faille de sécurité majeure.
      // Il est préférable d'utiliser une variable d'environnement ou de ne pas en créer du tout.
      const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'default_secure_password';
      await storage.createUser({
        username: "admin",
        password: defaultAdminPassword,
        role: "admin",
        permissions: DEFAULT_PERMISSIONS.admin
      });
      log("✓ Default admin user created: admin / " + defaultAdminPassword);
    }
  } catch (error) {
    log("Error creating default admin: " + (error as Error).message);
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
      log("✓ System setting app_name initialized");
    }
  } catch (error) {
    log("Error initializing system settings: " + (error as Error).message);
  }
}

(async () => {
  // --- Run migrations at startup ---
  try {
    log("🏗️ Running database migrations (push:pg)...");
    execSync("npx drizzle-kit push", { stdio: "inherit" });
    log("✅ Migrations applied.");
  } catch (e) {
    log("🚨 Migration failed:", e);
  }

  // Create default admin and super admin
  await createDefaultAdmin();
  await createDefaultSuperAdmin();
  await initializeSystemSettings();

  const server = await registerRoutes(app);

  // Correction 3 : Le middleware de gestion d'erreur ne doit pas relancer l'erreur
  // après avoir envoyé une réponse. Cela provoquerait un crash.
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    log(`🚨 Erreur non gérée: ${err.message}`);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    // IMPORTANT : On retire le 'throw err;' pour éviter le crash du serveur.
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`serving on port ${port}`);
  });
})();
