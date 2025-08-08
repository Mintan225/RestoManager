/**
 * @file dev-utils.ts
 * @description Fonctions utilitaires pour le serveur en mode développement et production.
 */
import { Express } from "express";
import { log } from "./logger";

// Fonction pour configurer le serveur Vite en mode développement
export async function setupVite(app: Express, server: any) {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom"
  });
  app.use(vite.middlewares);
  log("✓ Vite dev server middleware activated.");
}

// Fonction pour servir les fichiers statiques en mode production
export function serveStatic(app: Express) {
  const path = require("path");
  app.use(require("serve-static")(path.join(process.cwd(), 'dist/')));
  log("✓ Serving production static files from /dist.");
}
