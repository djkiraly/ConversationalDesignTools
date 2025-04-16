import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import { log } from './vite';

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create drizzle database instance
export const db = drizzle(pool);

// Run migrations on startup
export async function runMigrations() {
  log('Running database migrations...', 'db');
  try {
    await migrate(db, { migrationsFolder: './migrations' });
    log('Migrations completed successfully', 'db');
  } catch (error) {
    log(`Migration error: ${(error as Error).message}`, 'db');
    throw error;
  }
}

// Initialize the database
export async function initDatabase() {
  try {
    // Check database connection
    await pool.query('SELECT NOW()');
    log('Database connection established', 'db');
    
    // Run migrations
    await runMigrations();
    
    return true;
  } catch (error) {
    log(`Database initialization error: ${(error as Error).message}`, 'db');
    throw error;
  }
}