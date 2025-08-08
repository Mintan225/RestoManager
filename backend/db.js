import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared-types/schema";
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Only use SSL for external databases
    ...(process.env.DATABASE_URL?.includes('render.com') && {
        ssl: {
            rejectUnauthorized: false,
        }
    }),
});
export const db = drizzle(pool, { schema });
