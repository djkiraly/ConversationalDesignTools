import fs from 'fs';
import { exec } from 'child_process';

// Create a temporary configuration file for drizzle-kit
const tempConfig = `
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  schema: './shared/schema.ts',
  out: './migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
});
`;

// Write the temporary config file
fs.writeFileSync('drizzle.temp.config.ts', tempConfig);

// Run the db:push command with the temporary config
exec('drizzle-kit push --config=drizzle.temp.config.ts', (error, stdout, stderr) => {
  if (error) {
    console.error('Error pushing schema:', error);
    console.error(stderr);
    process.exit(1);
  }
  
  console.log(stdout);
  
  // Clean up the temporary config file
  fs.unlinkSync('drizzle.temp.config.ts');
  console.log('Schema push completed successfully');
});
