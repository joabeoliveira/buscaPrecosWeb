import { pool } from '../db/pool.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '../../migrations/006_user_roles.sql'), 'utf8');
  try {
    await pool.query(sql);
    console.log('Migration 006 (Roles) executed successfully!');
  } catch (err) {
    console.error('Migration 006 failed:', err);
  } finally {
    process.exit();
  }
}

run();
