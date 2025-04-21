import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
const { Pool } = pg;
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
      password TEXT NOT NULL
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
      use_case_id INTEGER NOT NULL,
      step_number INTEGER NOT NULL,
      step_type TEXT,
      customer_text TEXT NOT NULL,
      agent_text TEXT NOT NULL,
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
  
  // Create transcripts table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS transcripts (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      content TEXT NOT NULL,
      analyzed_flow JSONB,
      metrics JSONB,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    )
  `);
  
  // Create journey_maps table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS journey_maps (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      node_data JSONB NOT NULL,
      node_styles JSONB,
      insights JSONB,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL
    )
  `);
}