// import { Pool, neonConfig } from '@neondatabase/serverless';
// import { drizzle } from 'drizzle-orm/neon-serverless';
// import { sql } from 'drizzle-orm';
// import ws from "ws";
// import * as schema from "@shared/schema";

// neonConfig.webSocketConstructor = ws;

// if (!process.env.DATABASE_URL) {
//   const errorMessage = "DATABASE_URL environment variable is required but not set. Please ensure your database is properly provisioned and the environment variable is configured.";
//   console.error(errorMessage);
//   throw new Error(errorMessage);
// }

// export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// export const db = drizzle({ client: pool, schema });

// // Test database connection
// export async function testDatabaseConnection(): Promise<void> {
//   try {
//     console.log('Testing database connection...');
//     // Simple query to test connection
//     await db.execute(sql`SELECT 1 as test`);
//     console.log('✓ Database connection successful');
//   } catch (error) {
//     console.error('✗ Database connection failed:', error);
//     throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
//   }
// }


import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  const errorMessage =
    "DATABASE_URL environment variable is required but not set.";

  console.error(errorMessage);
  throw new Error(errorMessage);
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

// Test database connection
export async function testDatabaseConnection(): Promise<void> {
  try {
    console.log('Testing database connection...');

    await db.execute(sql`SELECT 1`);

    console.log('✓ Database connection successful');
  } catch (error) {
    console.error('✗ Database connection failed:', error);

    throw new Error(
      `Database connection failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}