// server/db.ts
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres"; // Utilisation du driver 'node-postgres' pour Drizzle
import * as schema from "@shared-types/schema";
import { User, Order } from '@shared-types/schema';
import { env } from '../env';

// --- Gestion des variables d'environnement ---
if (!env.DATABASE_URL) {
  // Préférable d'utiliser un logger ici pour un contexte plus riche
  console.error("DATABASE_URL must be set. Did you forget to provision a database?");
  process.exit(1); // Arrêter l'application avec un code d'erreur
}

// --- Configuration SSL plus robuste ---
const useSsl = env.DB_SSL === "true"; // Utiliser une variable d'environnement dédiée

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });

