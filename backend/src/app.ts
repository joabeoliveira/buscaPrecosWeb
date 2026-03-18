import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import crypto from 'crypto';

import { ListController } from './controllers/ListController.js';
import { SearchController } from './controllers/SearchController.js';
import { UserController } from './controllers/UserController.js';

dotenv.config();

const app = express();
const listController = new ListController();
const searchController = new SearchController();
const userController = new UserController();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use(limiter);

// Request ID + Logging Middleware
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

// Routes
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// List Routes
app.post('/api/v1/lists', listController.create);
app.get('/api/v1/lists', listController.listAll);
app.get('/api/v1/lists/:id', listController.getById);
app.get('/api/v1/lists/:id/results', listController.getResults);
app.get('/api/v1/lists/:id/export', listController.exportCsv);
app.patch('/api/v1/items/:itemId/approve', listController.approveItem);
app.post('/api/v1/items/:itemId/select', listController.selectResult);

// Search Routes
app.post('/api/v1/search/batch', searchController.startBatch);
app.get('/api/v1/search/status/:jobId', searchController.getStatus);

// User/Responsible Routes
app.get('/api/v1/users', userController.listAll);
app.post('/api/v1/users', userController.create);
app.post('/api/v1/users/login', userController.login);
app.delete('/api/v1/users/:id', userController.delete);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    code: err.code || 'INTERNAL_ERROR',
    message: err.message || 'Something went wrong!',
    requestId: res.getHeader('x-request-id'),
  });
});

export default app;
