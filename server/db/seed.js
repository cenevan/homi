import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function splitCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // escaped quote
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => {
    const t = s.trim();
    return t.startsWith('"') && t.endsWith('"') ? t.slice(1, -1) : t;
  });
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const header = splitCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    if (cols.length !== header.length) {
      // skip malformed rows
      continue;
    }
    const obj = {};
    header.forEach((h, idx) => {
      obj[h.trim()] = cols[idx];
    });
    rows.push(obj);
  }
  return rows;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'homi',
  user: process.env.PGUSER || 'homi',
  password: process.env.PGPASSWORD || 'homi',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

async function seedInventory(rows) {
  for (const r of rows) {
    const values = [
      r.item_name,
      r.owner,
      r.category,
      r.status || 'available',
      r.tag || 'free-to-borrow',
      r.date_added || new Date().toISOString().slice(0, 10),
      r.description || null,
    ];
    await pool.query(
      `insert into inventory_items (item_name, owner_name, category, status, tag, date_added, description)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict do nothing`,
      values
    );
  }
}

async function seedShopping(rows) {
  for (const r of rows) {
    const values = [
      r.item_name,
      r.owner,
      r.category,
      r.priority || 'medium',
      r.date_added || new Date().toISOString().slice(0, 10),
      r.status || 'needed',
      r.notes || null,
    ];
    await pool.query(
      `insert into shopping_list_items (item_name, owner_name, category, priority, date_added, status, notes)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict do nothing`,
      values
    );
  }
}

async function main() {
  const root = path.resolve(__dirname, '../../');
  const publicDir = path.join(root, 'public');
  const invPath = path.join(publicDir, 'inventory.csv');
  const shopPath = path.join(publicDir, 'shopping-list.csv');

  const inv = fs.existsSync(invPath) ? fs.readFileSync(invPath, 'utf8') : '';
  const shop = fs.existsSync(shopPath) ? fs.readFileSync(shopPath, 'utf8') : '';

  const invRows = parseCSV(inv);
  const shopRows = parseCSV(shop);

  await seedInventory(invRows);
  await seedShopping(shopRows);
  console.log('Seeded inventory and shopping list data.');
}

main()
  .catch((e) => {
    console.error('Failed to seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });

