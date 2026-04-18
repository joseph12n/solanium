const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productRoutes = require('./routes/product.routes');
const tenantRoutes = require('./routes/tenant.routes');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => res.json({ ok: true, service: 'solanium-backend' }));

app.use('/api/tenants', tenantRoutes);
app.use('/api/products', productRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'not_found', path: req.originalUrl }));

// Error handler central
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const payload = {
    error: err.code || 'internal_error',
    message: err.message,
  };
  if (err.details) payload.details = err.details;
  if (status >= 500) console.error('[error]', err);
  res.status(status).json(payload);
});

module.exports = app;
