import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

const baseUrl = process.env.QA_BASE_URL || 'http://localhost:3000';
const connectionString =
  process.env.DATABASE_URL || 'postgresql://dev:dev123@localhost:5437/BuscaPrecosWeb';

const pool = new Pool({ connectionString });

const ok = (name, details = '') => {
  console.log(`OK ${name}${details ? ` - ${details}` : ''}`);
};

const fail = (name, details = '') => {
  throw new Error(`FAIL ${name}${details ? ` - ${details}` : ''}`);
};

const request = async (path, options = {}) => {
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (error) {
    fail(
      `request ${path}`,
      `could not reach ${baseUrl}. Start Next.js first or set QA_BASE_URL. ${error.message}`
    );
  }

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { response, body };
};

const expectStatus = (name, result, status) => {
  if (result.response.status !== status) {
    fail(name, `expected ${status}, got ${result.response.status}: ${JSON.stringify(result.body)}`);
  }
  ok(name, String(status));
};

const login = async (email, password) => {
  const result = await request('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  expectStatus(`login ${email}`, result, 200);
  return result.body.token;
};

const ensureClient = async (name) => {
  const existing = await pool.query('SELECT id, name FROM clients WHERE name = $1 LIMIT 1', [name]);
  if (existing.rowCount > 0) return existing.rows[0];

  const created = await pool.query(
    'INSERT INTO clients (name, email, active) VALUES ($1, $2, true) RETURNING id, name',
    [name, 'qa@example.com']
  );
  return created.rows[0];
};

const ensureQaData = async () => {
  const alfa = await ensureClient('QA Cliente Alfa');
  const bravo = await ensureClient('QA Cliente Bravo');
  const password = 'qa123456';
  const passwordHash = await bcrypt.hash(password, 10);

  const users = [
    ['QA Cliente Alfa Admin', 'qa.alfa.admin@example.com', 'client_admin', alfa.id],
    ['QA Cliente Bravo Buyer', 'qa.bravo.buyer@example.com', 'client_buyer', bravo.id],
  ];

  for (const [name, email, role, clientId] of users) {
    await pool.query(
      `INSERT INTO users (name, email, role, password_hash, client_id, active)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (email)
       DO UPDATE SET
         name = EXCLUDED.name,
         role = EXCLUDED.role,
         password_hash = EXCLUDED.password_hash,
         client_id = EXCLUDED.client_id,
         active = true`,
      [name, email, role, passwordHash, clientId]
    );
  }

  await pool.query(
    `INSERT INTO item_categories (client_id, name)
     VALUES ($1, $2), ($3, $4)
     ON CONFLICT (client_id, name) DO NOTHING`,
    [alfa.id, 'Materiais QA', bravo.id, 'Categoria Bravo QA']
  );

  return { alfa, bravo, password };
};

const getClientList = async (clientId) => {
  const result = await pool.query(
    'SELECT id FROM shopping_lists WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1',
    [clientId]
  );
  return result.rows[0]?.id || null;
};

const main = async () => {
  const { alfa, bravo, password } = await ensureQaData();
  ok('qa data seeded', `${alfa.name} / ${bravo.name}`);

  const alfaToken = await login('qa.alfa.admin@example.com', password);
  const bravoToken = await login('qa.bravo.buyer@example.com', password);

  const alfaLists = await request('/api/lists', { token: alfaToken });
  expectStatus('client_admin lists own client', alfaLists, 200);
  if (!alfaLists.body.every((list) => list.client_id === alfa.id)) {
    fail('client_admin list isolation', 'returned a list from another client');
  }
  ok('client_admin list isolation', `${alfaLists.body.length} list(s)`);

  const bravoLists = await request('/api/lists', { token: bravoToken });
  expectStatus('client_buyer lists own client', bravoLists, 200);
  if (!bravoLists.body.every((list) => list.client_id === bravo.id)) {
    fail('client_buyer list isolation', 'returned a list from another client');
  }
  ok('client_buyer list isolation', `${bravoLists.body.length} list(s)`);

  let bravoListId = await getClientList(bravo.id);
  if (!bravoListId) {
    const created = await request('/api/lists', {
      token: bravoToken,
      method: 'POST',
      body: JSON.stringify({
        name: 'QA Bravo Cotacao',
        items: [{ query: 'Item Bravo QA', unit: 'un', quantity: 1 }],
      }),
    });
    expectStatus('client_buyer creates own quotation for fixture', created, 201);
    bravoListId = created.body.id;
  }

  const forbiddenDetail = await request(`/api/lists/${bravoListId}`, { token: alfaToken });
  expectStatus('client_admin cannot access other client quotation', forbiddenDetail, 403);

  const forgedCreate = await request('/api/lists', {
    token: alfaToken,
    method: 'POST',
    body: JSON.stringify({
      name: 'QA Forged Client',
      clientId: bravo.id,
      items: [{ query: 'Item Forjado', unit: 'un', quantity: 1 }],
    }),
  });
  expectStatus('client_admin cannot forge clientId', forgedCreate, 403);

  const createOwn = await request('/api/lists', {
    token: alfaToken,
    method: 'POST',
    body: JSON.stringify({
      name: `QA Alfa ${new Date().toISOString()}`,
      items: [
        {
          query: 'Papel A4 QA',
          unit: 'cx',
          quantity: 2,
          sku_grade: 'caixa com 10',
          target_price: 123.45,
        },
      ],
    }),
  });
  expectStatus('client_admin creates own quotation', createOwn, 201);

  const createdList = await pool.query('SELECT client_id FROM shopping_lists WHERE id = $1', [
    createOwn.body.id,
  ]);
  if (createdList.rows[0]?.client_id !== alfa.id) {
    fail('created quotation is scoped to token client');
  }
  ok('created quotation is scoped to token client');

  const ownCategories = await request(`/api/clients/${alfa.id}/categories`, { token: alfaToken });
  expectStatus('client_admin lists own categories', ownCategories, 200);

  const createCategory = await request(`/api/clients/${alfa.id}/categories`, {
    token: alfaToken,
    method: 'POST',
    body: JSON.stringify({ name: `QA Categoria ${Date.now()}` }),
  });
  expectStatus('client_admin creates own category', createCategory, 201);

  const buyerCategory = await request(`/api/clients/${bravo.id}/categories`, {
    token: bravoToken,
    method: 'POST',
    body: JSON.stringify({ name: `QA Buyer Categoria ${Date.now()}` }),
  });
  expectStatus('client_buyer cannot create category', buyerCategory, 403);

  const clientsList = await request('/api/clients', { token: alfaToken });
  expectStatus('client_admin cannot list all clients', clientsList, 403);

  const n8nList = await request('/api/n8n/pending-notifications', { token: alfaToken });
  expectStatus('client_admin cannot access n8n pending notifications', n8nList, 403);

  console.log('B2B QA completed');
};

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
