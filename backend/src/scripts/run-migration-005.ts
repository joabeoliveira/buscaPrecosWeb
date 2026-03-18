import fs from 'fs';
import path from 'path';
import { pool } from '../db/pool.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const sqlPath = path.join(__dirname, '../../migrations/005_add_unit_quantity.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Running 005_add_unit_quantity migrations...');
  try {
    await pool.query(sql);
    console.log('Migration 005 completed successfully.');
  } catch (error) {
    console.error('Migration 005 failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
