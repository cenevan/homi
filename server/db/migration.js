import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'homi',
  user: process.env.PGUSER || 'homi',
  password: process.env.PGPASSWORD || 'homi',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

async function main() {
  try {
    // Add missing columns to picked_up_items table
    await pool.query(`
      ALTER TABLE picked_up_items
      ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS date_paid date;
    `);
    console.log('Migration completed: Added paid and date_paid columns to picked_up_items table.');
  } catch (e) {
    console.error('Migration failed:', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();