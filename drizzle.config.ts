import { defineConfig } from "drizzle-kit";
import type { Config } from "drizzle-kit";

console.log('DEBUG_RENDER: DATABASE_URL value:', process.env.DATABASE_URL); // Gardez cette ligne de debug

const config: Config = {
  schema: "./shared/schema.ts", // Vérifiez bien que c'est le chemin exact et le nom de fichier (schema.ts)
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!, // <-- REVENIR À 'url' et ajouter '!'
    ssl: true, // <-- REVENIR À 'ssl: true' pour la simplicité avec Render
  },
};

export default defineConfig(config);