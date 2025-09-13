import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || undefined,
  host: process.env.PGHOST || 'localhost',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'homi',
  user: process.env.PGUSER || 'homi',
  password: process.env.PGPASSWORD || 'homi',
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

// Healthcheck
app.get('/api/health', async (_req, res) => {
  try {
    const r = await pool.query('select 1 as ok');
    res.json({ ok: true, db: r.rows[0].ok === 1 });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Inventory endpoints
app.get('/api/inventory', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'select id, item_name, owner_name as owner, category, status, tag, date_added, description from inventory_items order by id asc'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch inventory', details: String(e) });
  }
});

app.post('/api/inventory', async (req, res) => {
  try {
    const { item_name, owner, category, tag, description } = req.body || {};
    if (!item_name || !owner || !category) {
      return res.status(400).json({ error: 'item_name, owner, category are required' });
    }
    const { rows } = await pool.query(
      `insert into inventory_items (item_name, owner_name, category, status, tag, date_added, description)
       values ($1,$2,$3,'available',$4, current_date, $5)
       returning id, item_name, owner_name as owner, category, status, tag, date_added, description`,
      [item_name, owner, category, tag || 'free-to-borrow', description || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add item', details: String(e) });
  }
});

app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const { rows } = await pool.query(
      'delete from inventory_items where id = $1 returning id, item_name, owner_name as owner, category, status, tag, date_added, description',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete item', details: String(e) });
  }
});

// Shopping list endpoints
app.get('/api/shopping-list', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'select id, item_name, owner_name as owner, category, priority, date_added, status, notes from shopping_list_items order by id asc'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch shopping list', details: String(e) });
  }
});

app.post('/api/shopping-list', async (req, res) => {
  try {
    const { item_name, owner, category, priority, notes } = req.body || {};
    if (!item_name || !owner || !category) {
      return res.status(400).json({ error: 'item_name, owner, category are required' });
    }
    const { rows } = await pool.query(
      `insert into shopping_list_items (item_name, owner_name, category, priority, date_added, status, notes)
       values ($1,$2,$3, coalesce($4,'medium'), current_date, 'needed', $5)
       returning id, item_name, owner_name as owner, category, priority, date_added, status, notes`,
      [item_name, owner, category, priority || 'medium', notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add shopping item', details: String(e) });
  }
});

app.delete('/api/shopping-list/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    const { rows } = await pool.query(
      'delete from shopping_list_items where id = $1 returning id, item_name, owner_name as owner, category, priority, date_added, status, notes',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ deleted: rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete shopping item', details: String(e) });
  }
});

// Receipts endpoints
app.get('/api/receipts', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'select id, receipt_name, file_name, uploaded_by, upload_date, store_name, total_cost, notes from receipts order by id asc'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch receipts', details: String(e) });
  }
});

app.post('/api/receipts', async (req, res) => {
  try {
    const { name, fileName, uploadedBy, storeName, totalCost, notes } = req.body || {};
    if (!name || !uploadedBy) {
      return res.status(400).json({ error: 'name and uploadedBy are required' });
    }
    const { rows } = await pool.query(
      `insert into receipts (receipt_name, file_name, uploaded_by, store_name, total_cost, notes)
       values ($1,$2,$3,$4,$5,$6)
       returning id, receipt_name, file_name, uploaded_by, upload_date, store_name, total_cost, notes`,
      [name, fileName || null, uploadedBy, storeName || null, totalCost || null, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to save receipt', details: String(e) });
  }
});

// Picked-up items endpoints
app.get('/api/picked-up-items', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'select id, item_name, original_owner, picked_up_by, category, priority, date_picked_up, receipt_id, receipt_image, store_name, cost, notes, paid, date_paid from picked_up_items order by id asc'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch picked-up items', details: String(e) });
  }
});

app.post('/api/picked-up-items', async (req, res) => {
  try {
    const { item_name, original_owner, picked_up_by, category, priority, receipt_id, receipt_image, store_name, cost, notes } = req.body || {};
    if (!item_name || !original_owner || !picked_up_by || !category || !priority) {
      return res.status(400).json({ error: 'item_name, original_owner, picked_up_by, category, and priority are required' });
    }
    const { rows } = await pool.query(
      `insert into picked_up_items (item_name, original_owner, picked_up_by, category, priority, date_picked_up, receipt_id, receipt_image, store_name, cost, notes, paid, date_paid)
       values ($1,$2,$3,$4,$5, current_date, $6,$7,$8,$9,$10, false, null)
       returning id, item_name, original_owner, picked_up_by, category, priority, date_picked_up, receipt_id, receipt_image, store_name, cost, notes, paid, date_paid`,
      [item_name, original_owner, picked_up_by, category, priority, receipt_id || null, receipt_image || null, store_name || null, cost || null, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to add picked-up item', details: String(e) });
  }
});

app.patch('/api/picked-up-items/:id/mark-paid', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const { rows } = await pool.query(
      `update picked_up_items set paid = true, date_paid = current_date
       where id = $1
       returning id, item_name, original_owner, picked_up_by, category, priority, date_picked_up, receipt_id, receipt_image, store_name, cost, notes, paid, date_paid`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to mark item as paid', details: String(e) });
  }
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Homi API listening on http://localhost:${PORT}`);
});
