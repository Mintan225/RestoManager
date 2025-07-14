import { defineConfig } from "drizzle-kit";
import type { Config } from "drizzle-kit";

// Drizzle configuration for PostgreSQL on Render with SSL
const config: Config = {
  schema: ["./server/schema.ts"],    // chemin vers ton schéma Drizzle
  driver: "pg",                       // driver PostgreSQL
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,        // accepte le certificat auto-signé de Render
    },
  },
};

export default defineConfig(config);
