import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://dev:dev123@localhost:5437/BuscaPrecosWeb',
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});
