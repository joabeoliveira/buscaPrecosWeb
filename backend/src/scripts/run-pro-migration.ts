import fs from 'fs';
import path from 'path';
import { pool } from '../db/pool.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  const sqlPath = path.join(__dirname, '../../migrations/004_pro_flow_expansion.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Running professional flow expansion migrations...');
  try {
    await pool.query(sql);
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrate();
