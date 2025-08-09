var _a;
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared-types/schema";
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}
export const pool = new Pool(Object.assign({ connectionString: process.env.DATABASE_URL }, (((_a = process.env.DATABASE_URL) === null || _a === void 0 ? void 0 : _a.includes('render.com')) && {
    ssl: {
        rejectUnauthorized: false,
    }
})));
export const db = drizzle(pool, { schema });
