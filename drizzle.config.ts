import { defineConfig } from "drizzle-kit";
import type { Config } from "drizzle-kit";

// Drizzle configuration for PostgreSQL on Render with SSL
const config: Config = {
  schema: ["./src/shared/schema.ts"],    // chemin vers ton schéma Drizzle
  dialect: "postgresql",                       // driver PostgreSQL
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,        // accepte le certificat auto-signé de Render
    },
  },
};

export default defineConfig(config);
