const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Rutas de dominio — cada una montada bajo su prefijo /api/*
const productRoutes    = require('./routes/product.routes');
const tenantRoutes     = require('./routes/tenant.routes');
const customerRoutes   = require('./routes/customer.routes');
const invoiceRoutes    = require('./routes/invoice.routes');
const templateRoutes   = require('./routes/template.routes');
const userRoutes       = require('./routes/user.routes');
const activationRoutes = require('./routes/activation.routes');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '2mb' })); // 2MB: facturas con muchos items

app.get('/health', (_req, res) => res.json({ ok: true, service: 'solanium-backend' }));

app.use('/api/tenants',    tenantRoutes);
app.use('/api/products',   productRoutes);
app.use('/api/customers',  customerRoutes);
app.use('/api/invoices',   invoiceRoutes);
app.use('/api/templates',  templateRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/activation', activationRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'not_found', path: req.originalUrl }));

// Error handler central — mapea errores de servicio (status/code/details)
// a respuestas JSON uniformes. Los 5xx se loguean para observabilidad.
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
