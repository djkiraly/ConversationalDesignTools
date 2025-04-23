import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import ws from 'ws';
import { log } from './vite';
import * as schema from '@shared/schema';

// Configure neon to use websockets
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create drizzle database instance with our schema
export const db = drizzle(pool, { schema });

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
    
    try {
      // Run migrations (but don't fail if they don't work)
      await runMigrations();
    } catch (migrationError) {
      log(`Migration warning: ${(migrationError as Error).message}`, 'db');
      log('Continuing without migrations...', 'db');
      
      // Create tables directly if migrations fail
      try {
        log('Attempting to create tables directly...', 'db');
        await createTablesDirectly();
        log('Tables created successfully', 'db');
      } catch (tableError) {
        log(`Table creation warning: ${(tableError as Error).message}`, 'db');
        log('Tables may already exist, continuing...', 'db');
      }
    }
    
    return true;
  } catch (error) {
    log(`Database initialization error: ${(error as Error).message}`, 'db');
    throw error;
  }
}

// Create tables directly if migrations fail
async function createTablesDirectly() {
  // Create users table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    )
  `);
  
  // Create use_cases table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS use_cases (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      conversation_flow TEXT NOT NULL,
      node_positions TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    )
  `);
  
  // Create flow_nodes table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS flow_nodes (
      id SERIAL PRIMARY KEY,
      use_case_id INTEGER NOT NULL REFERENCES use_cases(id),
      step_number INTEGER NOT NULL,
      step_type TEXT,
      messages TEXT NOT NULL,
      next_node_id INTEGER,
      position_x REAL,
      position_y REAL
    )
  `);
  
  // Create settings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    )
  `);
  
  // Create customer_journeys table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_journeys (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      nodes JSONB NOT NULL,
      edges JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    )
  `);
}