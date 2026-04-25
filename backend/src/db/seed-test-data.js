/**
 * Seed idempotente para pruebas de frontend.
 *
 * Crea por tenant: branding, plantilla default, activación (code + Bearer),
 * usuarios, productos, clientes e historial de facturas distribuidas en
 * los últimos 30 días (estados mixtos: emitida/pagada/anulada).
 *
 * Uso:
 *   node src/db/seed-test-data.js
 */

const { pool, withTransaction } = require('../config/db');
const {
  hashPassword,
  generateToken,
  generateCode,
} = require('../config/crypto');
const { PRESET_TEMPLATES } = require('../../../shared/schemas');

const TEST_PASSWORD = '*usuario123';

const TENANTS = [
  {
    slug: 'papeleria-central',
    nombre: 'Papelería Central',
    tipo_negocio: 'papeleria',
    template_slug: 'papeleria-vibrant',
    branding: {
      empresa: 'Papelería Central',
      eslogan: 'Todo para tu oficina',
      color_primario: '#f97316',
      color_secundario: '#ec4899',
    },
  },
  {
    slug: 'carniceria-la-res',
    nombre: 'Carnicería La Res',
    tipo_negocio: 'carniceria',
    template_slug: 'carniceria-bold',
    branding: {
      empresa: 'Carnicería La Res',
      eslogan: 'Cortes frescos cada día',
      color_primario: '#dc2626',
      color_secundario: '#7f1d1d',
    },
  },
  {
    slug: 'electro-hub',
    nombre: 'Electro Hub',
    tipo_negocio: 'electronica',
    template_slug: 'electronica-vibrant',
    branding: {
      empresa: 'Electro Hub',
      eslogan: 'Tecnología sin fronteras',
      color_primario: '#22c55e',
      color_secundario: '#a855f7',
    },
  },
  {
    slug: 'generico-demo',
    nombre: 'Solanium Demo',
    tipo_negocio: 'generico',
    template_slug: 'generico-vibrant',
    branding: {
      empresa: 'Solanium Demo',
      eslogan: 'Un catálogo, mil posibilidades',
      color_primario: '#a855f7',
      color_secundario: '#22d3ee',
    },
  },
];

const TENANT_USERS = {
  'papeleria-central': [
    { email: 'admin@papeleria.dev',    nombre: 'Admin Papelería',    role: 'admin' },
    { email: 'operador@papeleria.dev', nombre: 'Operador Papelería', role: 'operador' },
    { email: 'lectura@papeleria.dev',  nombre: 'Solo Lectura',       role: 'solo_lectura' },
  ],
  'carniceria-la-res': [
    { email: 'admin@carniceria.dev', nombre: 'Admin Carnicería', role: 'admin' },
  ],
  'electro-hub': [
    { email: 'admin@electronica.dev', nombre: 'Admin Electrónica', role: 'admin' },
  ],
  'generico-demo': [
    { email: 'admin@generico.dev', nombre: 'Admin Demo', role: 'admin' },
  ],
};

const SUPER_ADMIN = {
  email: 'super@solanium.dev',
  nombre: 'Super Admin Solanium',
  role: 'super_admin',
};

// ── Productos por rubro ──────────────────────────────────────────────
const SEED_PRODUCTS = {
  papeleria: [
    { sku: 'PAP-001', nombre: 'Cuaderno universitario 100 hojas', precio: 2.50, stock: 180, unidad: 'unidad' },
    { sku: 'PAP-002', nombre: 'Bolígrafo tinta azul (caja 12)',  precio: 4.20, stock: 95,  unidad: 'caja' },
    { sku: 'PAP-003', nombre: 'Resma de papel A4 (500 hojas)',   precio: 6.75, stock: 3,   unidad: 'resma' },
    { sku: 'PAP-004', nombre: 'Carpeta plástica con broche',     precio: 1.80, stock: 210, unidad: 'unidad' },
    { sku: 'PAP-005', nombre: 'Marcadores fluor (set 6)',        precio: 3.40, stock: 60,  unidad: 'set' },
    { sku: 'PAP-006', nombre: 'Tijera escolar punta roma',       precio: 1.90, stock: 130, unidad: 'unidad' },
    { sku: 'PAP-007', nombre: 'Pegamento en barra 40g',          precio: 0.95, stock: 240, unidad: 'unidad' },
    { sku: 'PAP-008', nombre: 'Cartuchera con cremallera',       precio: 5.20, stock: 4,   unidad: 'unidad' },
    { sku: 'PAP-009', nombre: 'Goma de borrar blanca',           precio: 0.30, stock: 350, unidad: 'unidad' },
    { sku: 'PAP-010', nombre: 'Lápiz grafito HB (caja 12)',      precio: 2.10, stock: 85,  unidad: 'caja' },
  ],
  carniceria: [
    { sku: 'CAR-001', nombre: 'Lomo de res',              precio: 8.99, stock: 25, unidad: 'kg' },
    { sku: 'CAR-002', nombre: 'Costilla de cerdo',        precio: 6.50, stock: 18, unidad: 'kg' },
    { sku: 'CAR-003', nombre: 'Pechuga de pollo',         precio: 4.20, stock: 40, unidad: 'kg' },
    { sku: 'CAR-004', nombre: 'Chorizo artesanal',        precio: 5.80, stock: 3,  unidad: 'kg' },
    { sku: 'CAR-005', nombre: 'Bistec de solomillo',      precio: 11.90, stock: 12, unidad: 'kg' },
    { sku: 'CAR-006', nombre: 'Molida especial',          precio: 5.10, stock: 22, unidad: 'kg' },
    { sku: 'CAR-007', nombre: 'Alitas de pollo',          precio: 3.60, stock: 4,  unidad: 'kg' },
    { sku: 'CAR-008', nombre: 'Jamón serrano lonja',      precio: 14.50, stock: 6,  unidad: 'kg' },
    { sku: 'CAR-009', nombre: 'Hueso para caldo',         precio: 1.80, stock: 50, unidad: 'kg' },
    { sku: 'CAR-010', nombre: 'Morcilla tradicional',     precio: 4.90, stock: 9,  unidad: 'kg' },
  ],
  electronica: [
    { sku: 'ELE-001', nombre: 'Cable USB-C 1m',                 precio: 5.99,  stock: 80, unidad: 'unidad' },
    { sku: 'ELE-002', nombre: 'Cargador rápido 20W',            precio: 18.50, stock: 35, unidad: 'unidad' },
    { sku: 'ELE-003', nombre: 'Auriculares Bluetooth in-ear',   precio: 32.00, stock: 2,  unidad: 'unidad' },
    { sku: 'ELE-004', nombre: 'Parlante portátil 10W',          precio: 24.90, stock: 14, unidad: 'unidad' },
    { sku: 'ELE-005', nombre: 'Power bank 10 000 mAh',          precio: 21.75, stock: 22, unidad: 'unidad' },
    { sku: 'ELE-006', nombre: 'Cable HDMI 2.0 (2m)',            precio: 7.40,  stock: 58, unidad: 'unidad' },
    { sku: 'ELE-007', nombre: 'Mouse inalámbrico ergonómico',   precio: 15.20, stock: 3,  unidad: 'unidad' },
    { sku: 'ELE-008', nombre: 'Teclado mecánico 60%',           precio: 68.00, stock: 11, unidad: 'unidad' },
    { sku: 'ELE-009', nombre: 'Adaptador USB-C a Jack 3.5',     precio: 6.50,  stock: 90, unidad: 'unidad' },
    { sku: 'ELE-010', nombre: 'Webcam 1080p',                   precio: 42.00, stock: 7,  unidad: 'unidad' },
  ],
  generico: [
    { sku: 'GEN-001', nombre: 'Consultoría por hora',           precio: 50.00, stock: 999, unidad: 'hora' },
    { sku: 'GEN-002', nombre: 'Plan básico mensual',            precio: 29.00, stock: 999, unidad: 'mes' },
    { sku: 'GEN-003', nombre: 'Plan pro mensual',               precio: 79.00, stock: 999, unidad: 'mes' },
    { sku: 'GEN-004', nombre: 'Licencia anual estándar',        precio: 299.00, stock: 999, unidad: 'año' },
    { sku: 'GEN-005', nombre: 'Soporte técnico premium',        precio: 120.00, stock: 999, unidad: 'tiquete' },
    { sku: 'GEN-006', nombre: 'Capacitación grupal',            precio: 350.00, stock: 3,  unidad: 'sesión' },
    { sku: 'GEN-007', nombre: 'Diseño de identidad',            precio: 480.00, stock: 2,  unidad: 'proyecto' },
    { sku: 'GEN-008', nombre: 'Setup de servidor',              precio: 180.00, stock: 10, unidad: 'servicio' },
    { sku: 'GEN-009', nombre: 'Auditoría trimestral',           precio: 650.00, stock: 4,  unidad: 'auditoría' },
    { sku: 'GEN-010', nombre: 'Onboarding personalizado',       precio: 99.00,  stock: 999, unidad: 'cliente' },
  ],
};

// ── Clientes por tenant ──────────────────────────────────────────────
const SEED_CUSTOMERS = [
  { nombre: 'María González',      documento: 'V-12345678', email: 'maria@cliente.dev',   telefono: '+58 414 1234567', direccion: 'Av. Principal 12' },
  { nombre: 'Juan Pérez',          documento: 'V-23456789', email: 'juan@cliente.dev',    telefono: '+58 424 2345678', direccion: 'Calle Sur 45' },
  { nombre: 'Ana Rodríguez',       documento: 'V-34567890', email: 'ana@cliente.dev',     telefono: '+58 412 3456789', direccion: 'Urb. Los Jardines' },
  { nombre: 'Empresa ACME S.A.',   documento: 'J-40123456-0', email: 'compras@acme.dev',  telefono: '+58 212 5551234', direccion: 'Torre Plaza, piso 9' },
  { nombre: 'Carlos Ramírez',      documento: 'V-45678901', email: 'carlos@cliente.dev',  telefono: '+58 416 4567890', direccion: 'Res. Las Palmas' },
];

// ─────────────────────────────────────────────────────────────────────
async function upsertTenant(client, t) {
  const brandingJson = JSON.stringify(t.branding);
  const { rows } = await client.query(
    `INSERT INTO tenants (slug, nombre, tipo_negocio, branding, plan)
     VALUES ($1,$2,$3,$4::jsonb,'starter')
     ON CONFLICT (slug) DO UPDATE SET
       nombre = EXCLUDED.nombre,
       tipo_negocio = EXCLUDED.tipo_negocio,
       branding = EXCLUDED.branding,
       activo = TRUE
     RETURNING *`,
    [t.slug, t.nombre, t.tipo_negocio, brandingJson]
  );
  return rows[0];
}

async function upsertTemplate(client, tenantId, slug) {
  const preset = PRESET_TEMPLATES.find((p) => p.slug === slug);
  if (!preset) throw new Error(`preset no encontrado: ${slug}`);

  await client.query(
    `UPDATE invoice_templates SET is_default = FALSE
       WHERE tenant_id = $1 AND is_default = TRUE`,
    [tenantId]
  );
  const { rows } = await client.query(
    `INSERT INTO invoice_templates
       (tenant_id, slug, nombre, descripcion, is_default, theme, defaults)
     VALUES ($1,$2,$3,$4,TRUE,$5::jsonb,$6::jsonb)
     ON CONFLICT (tenant_id, slug) DO UPDATE SET
       nombre = EXCLUDED.nombre,
       descripcion = EXCLUDED.descripcion,
       is_default = TRUE,
       theme = EXCLUDED.theme,
       defaults = EXCLUDED.defaults
     RETURNING *`,
    [
      tenantId,
      preset.slug,
      preset.nombre,
      preset.descripcion,
      JSON.stringify(preset.theme),
      JSON.stringify(preset.defaults),
    ]
  );
  return rows[0];
}

async function ensureActivation(client, tenantId, templateSlug) {
  await client.query(
    `UPDATE activation_tokens
        SET revoked_at = NOW()
      WHERE tenant_id = $1 AND revoked_at IS NULL`,
    [tenantId]
  );
  const token = generateToken();
  const code = generateCode();
  const { rows } = await client.query(
    `INSERT INTO activation_tokens
       (tenant_id, token, code, code_refreshed_at,
        plan, subscription_type, template_slug, expires_at)
     VALUES ($1,$2,$3,NOW(),'starter','monthly',$4, NOW() + INTERVAL '30 days')
     RETURNING *`,
    [tenantId, token, code, templateSlug]
  );
  return rows[0];
}

async function upsertUser(client, { tenantId, email, nombre, role, passwordHash, passwordSalt }) {
  const existing = tenantId
    ? await client.query('SELECT id FROM users WHERE tenant_id = $1 AND email = $2', [tenantId, email])
    : await client.query('SELECT id FROM users WHERE tenant_id IS NULL AND email = $1', [email]);

  if (existing.rows[0]) {
    const { rows } = await client.query(
      `UPDATE users SET nombre=$2, password_hash=$3, password_salt=$4, role=$5, activo=TRUE
         WHERE id=$1
       RETURNING id, tenant_id, email, nombre, role, activo`,
      [existing.rows[0].id, nombre, passwordHash, passwordSalt, role]
    );
    return rows[0];
  }
  const { rows } = await client.query(
    `INSERT INTO users (tenant_id, email, nombre, password_hash, password_salt, role, activo)
     VALUES ($1,$2,$3,$4,$5,$6,TRUE)
     RETURNING id, tenant_id, email, nombre, role, activo`,
    [tenantId ?? null, email, nombre, passwordHash, passwordSalt, role]
  );
  return rows[0];
}

async function upsertProducts(client, tenantId, tipoNegocio) {
  const list = SEED_PRODUCTS[tipoNegocio] || SEED_PRODUCTS.generico;
  const rows = [];
  for (const p of list) {
    const { rows: r } = await client.query(
      `INSERT INTO products (tenant_id, sku, nombre, precio, stock, unidad, activo, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,TRUE,'{}'::jsonb)
       ON CONFLICT (tenant_id, sku) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         precio = EXCLUDED.precio,
         stock = EXCLUDED.stock,
         unidad = EXCLUDED.unidad,
         activo = TRUE
       RETURNING *`,
      [tenantId, p.sku, p.nombre, p.precio, p.stock, p.unidad]
    );
    rows.push(r[0]);
  }
  return rows;
}

async function upsertCustomers(client, tenantId) {
  const rows = [];
  for (const c of SEED_CUSTOMERS) {
    const { rows: r } = await client.query(
      `INSERT INTO customers (tenant_id, nombre, documento, email, telefono, direccion)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (tenant_id, documento) DO UPDATE SET
         nombre = EXCLUDED.nombre,
         email = EXCLUDED.email,
         telefono = EXCLUDED.telefono,
         direccion = EXCLUDED.direccion
       RETURNING *`,
      [tenantId, c.nombre, c.documento, c.email, c.telefono, c.direccion]
    );
    rows.push(r[0]);
  }
  return rows;
}

// Reset idempotente de facturas — borra las previas del tenant y recrea.
async function reseedInvoices(client, tenantId, products, customers) {
  await client.query(`DELETE FROM invoices WHERE tenant_id = $1`, [tenantId]);

  const ESTADOS = ['emitida', 'emitida', 'emitida', 'emitida', 'emitida', 'emitida', 'emitida', 'pagada', 'pagada', 'anulada'];
  const METODOS = ['efectivo', 'tarjeta', 'transferencia', 'efectivo', 'tarjeta'];
  const created = [];

  for (let i = 0; i < 10; i++) {
    // Distribuir en últimos 30 días (día 30..0)
    const daysAgo = Math.floor((30 / 10) * (10 - i));
    const emitidaEn = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const numero = `F-${String(i + 1).padStart(6, '0')}`;
    const estado = ESTADOS[i % ESTADOS.length];
    const metodo = METODOS[i % METODOS.length];
    const cust = customers[i % customers.length];

    // 1-3 líneas por factura
    const linesCount = 1 + (i % 3);
    const items = [];
    let subtotal = 0;
    for (let k = 0; k < linesCount; k++) {
      const p = products[(i * 3 + k) % products.length];
      const cantidad = k === 0 ? 1 + (i % 3) : 1 + (k % 2);
      const precio = Number(p.precio);
      const linea = Math.round(precio * cantidad * 100) / 100;
      subtotal = Math.round((subtotal + linea) * 100) / 100;
      items.push({ p, cantidad, precio, linea });
    }
    const impuestoPct = 0;
    const impuestoTotal = 0;
    const descuento = 0;
    const total = subtotal + impuestoTotal - descuento;

    const { rows: invRows } = await client.query(
      `INSERT INTO invoices
         (tenant_id, numero, customer_id, estado, metodo_pago, moneda,
          subtotal, impuesto_pct, impuesto_total, descuento, total,
          emitida_en, metadata)
       VALUES ($1,$2,$3,$4,$5,'USD',$6,$7,$8,$9,$10,$11,'{}'::jsonb)
       RETURNING id`,
      [tenantId, numero, cust.id, estado, metodo, subtotal, impuestoPct, impuestoTotal, descuento, total, emitidaEn.toISOString()]
    );
    const invoiceId = invRows[0].id;

    for (let k = 0; k < items.length; k++) {
      const it = items[k];
      await client.query(
        `INSERT INTO invoice_items
           (invoice_id, tenant_id, product_id, sku_snapshot, nombre_snapshot,
            unidad_snapshot, cantidad, precio_unitario, descuento_unit, subtotal, orden)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,0,$9,$10)`,
        [invoiceId, tenantId, it.p.id, it.p.sku, it.p.nombre, it.p.unidad, it.cantidad, it.precio, it.linea, k]
      );
    }
    created.push({ numero, estado, total });
  }
  return created;
}

// ─────────────────────────────────────────────────────────────────────
async function run() {
  const { hash, salt } = await hashPassword(TEST_PASSWORD);

  const summary = {
    superAdmin: null,
    tenants: [],
  };

  await withTransaction(async (client) => {
    summary.superAdmin = await upsertUser(client, {
      tenantId: null,
      email: SUPER_ADMIN.email,
      nombre: SUPER_ADMIN.nombre,
      role: SUPER_ADMIN.role,
      passwordHash: hash,
      passwordSalt: salt,
    });

    for (const t of TENANTS) {
      const tenantRow = await upsertTenant(client, t);
      await upsertTemplate(client, tenantRow.id, t.template_slug);
      const activation = await ensureActivation(client, tenantRow.id, t.template_slug);

      const users = [];
      for (const u of TENANT_USERS[t.slug] || []) {
        const created = await upsertUser(client, {
          tenantId: tenantRow.id,
          email: u.email,
          nombre: u.nombre,
          role: u.role,
          passwordHash: hash,
          passwordSalt: salt,
        });
        users.push(created);
      }

      const products = await upsertProducts(client, tenantRow.id, tenantRow.tipo_negocio);
      const customers = await upsertCustomers(client, tenantRow.id);
      const invoices = await reseedInvoices(client, tenantRow.id, products, customers);

      summary.tenants.push({
        slug: tenantRow.slug,
        nombre: tenantRow.nombre,
        tipo_negocio: tenantRow.tipo_negocio,
        code: activation.code,
        session_token: activation.token,
        expires_at: activation.expires_at,
        users,
        productsCount: products.length,
        customersCount: customers.length,
        invoicesCount: invoices.length,
      });
    }
  });

  console.log('\n════════════════════════════════════════════════════════');
  console.log('  SOLANIUM — SEED DE PRUEBA COMPLETADO');
  console.log('════════════════════════════════════════════════════════');
  console.log(`  Password común de prueba: ${TEST_PASSWORD}`);
  console.log(`  Super-admin: ${summary.superAdmin.email}  (id=${summary.superAdmin.id})`);

  for (const t of summary.tenants) {
    console.log('\n──────────────────────────────────────────────────');
    console.log(`  Tenant: ${t.nombre}  (${t.slug})  [${t.tipo_negocio}]`);
    console.log(`  Code 6 dígitos: ${t.code}   (rota cada 15 min)`);
    console.log(`  Session Bearer:  ${t.session_token}`);
    console.log(`  Expira: ${t.expires_at}`);
    console.log(`  Productos: ${t.productsCount}   Clientes: ${t.customersCount}   Facturas: ${t.invoicesCount}`);
    console.log(`  Usuarios:`);
    for (const u of t.users) {
      console.log(`    • ${u.email.padEnd(28)} rol=${u.role}`);
    }
  }
  console.log('\n════════════════════════════════════════════════════════\n');
}

run()
  .catch((err) => {
    console.error('[seed] falló:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
