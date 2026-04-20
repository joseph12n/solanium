/**
 * test:api — Pruebas CRUD completas contra el backend de Solanium.
 *
 * Ejecutar: node backend/tests/testApiModule.js
 *
 * Verifica el flujo completo:
 *   1. Health check
 *   2. Tenant: listar + obtener por slug
 *   3. Products: CRUD completo
 *   4. Customers: CRUD completo
 *   5. Templates: CRUD + presets + apply-preset
 *   6. Invoices: CRUD + summary + transacciones con stock
 *
 * Convenciones:
 *   - Cada test es autocontenido y limpia sus datos al final.
 *   - Errores se capturan con try/catch y se reportan con ✗.
 */
const BASE = process.env.API_BASE || 'http://localhost:4000';
const TENANT_SLUG = process.env.TENANT_SLUG || 'papeleria-central';
const SUPER_KEY = process.env.SOLANIUM_SUPER_ADMIN_KEY || 'solanium-dev-master-key';

let passed = 0;
let failed = 0;
const errors = [];

// Token Bearer emitido por el onboarding. Si existe, reemplaza x-tenant-slug.
let ACTIVE_TOKEN = null;

/* =====================================================================
 * Helpers HTTP — reutilizables para todas las pruebas
 * ===================================================================== */

async function request(method, path, body = null, extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };
  // Preferir Bearer si ya tenemos uno (flujo SaaS real),
  // si no, caer a x-tenant-slug (modo dev/test).
  if (ACTIVE_TOKEN && !extraHeaders.Authorization) {
    headers.Authorization = `Bearer ${ACTIVE_TOKEN}`;
  } else if (!extraHeaders['x-tenant-slug']) {
    headers['x-tenant-slug'] = TENANT_SLUG;
  }

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const json = await res.json().catch(() => ({}));

  return { status: res.status, ok: res.ok, body: json };
}

async function superRequest(method, path, body = null) {
  return request(method, path, body, { 'x-super-admin-key': SUPER_KEY });
}

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    errors.push(label);
    console.log(`  ✗ ${label}`);
  }
}

/* =====================================================================
 * Suite de pruebas
 * ===================================================================== */

async function testHealth() {
  console.log('\n🔍 Health Check');
  const res = await fetch(`${BASE}/health`);
  const data = await res.json();
  assert(res.ok && data.ok === true, 'GET /health retorna { ok: true }');
}

async function testTenants() {
  console.log('\n👤 Tenants');
  const list = await request('GET', '/api/tenants');
  assert(list.ok && Array.isArray(list.body.data), 'GET /api/tenants retorna array');
  assert(list.body.data.length > 0, 'Hay al menos 1 tenant');

  const current = await request('GET', '/api/tenants/current');
  assert(current.ok && current.body.data?.slug === TENANT_SLUG, `GET /api/tenants/current retorna slug=${TENANT_SLUG}`);
}

async function testProducts() {
  console.log('\n📦 Products CRUD');

  // CREATE
  const createRes = await request('POST', '/api/products', {
    sku: 'TEST-001',
    nombre: 'Producto de Prueba',
    precio: 9999,
    stock: 50,
    unidad: 'unidad',
    metadata: { presentacion: 'Unidad de test' },
  });
  assert(createRes.ok && createRes.body.data?.id, 'POST /api/products — crea producto');
  const productId = createRes.body.data?.id;

  // LIST
  const listRes = await request('GET', '/api/products');
  assert(listRes.ok && Array.isArray(listRes.body.data), 'GET /api/products — lista productos');

  // LIST con búsqueda
  const searchRes = await request('GET', '/api/products?search=Prueba');
  assert(searchRes.ok && searchRes.body.data?.length >= 1, 'GET /api/products?search=Prueba — encuentra el producto');

  // UPDATE
  if (productId) {
    const updateRes = await request('PATCH', `/api/products/${productId}`, {
      nombre: 'Producto Actualizado',
      precio: 12000,
    });
    assert(updateRes.ok && updateRes.body.data?.nombre === 'Producto Actualizado', 'PATCH /api/products/:id — actualiza');
  }

  // DELETE
  if (productId) {
    const deleteRes = await request('DELETE', `/api/products/${productId}`);
    assert(deleteRes.ok && deleteRes.body.deleted === true, 'DELETE /api/products/:id — elimina');
  }
}

async function testCustomers() {
  console.log('\n👥 Customers CRUD');

  // CREATE
  const createRes = await request('POST', '/api/customers', {
    nombre: 'Cliente Test API',
    documento: 'TEST-123456',
    email: 'test@solanium.dev',
    telefono: '+57 300 000 0000',
    direccion: 'Calle Test 123',
  });
  assert(createRes.ok && createRes.body.data?.id, 'POST /api/customers — crea cliente');
  const customerId = createRes.body.data?.id;

  // LIST
  const listRes = await request('GET', '/api/customers');
  assert(listRes.ok && Array.isArray(listRes.body.data), 'GET /api/customers — lista clientes');

  // GET by ID
  if (customerId) {
    const getRes = await request('GET', `/api/customers/${customerId}`);
    assert(getRes.ok && getRes.body.data?.nombre === 'Cliente Test API', 'GET /api/customers/:id — obtiene por ID');
  }

  // UPDATE
  if (customerId) {
    const updateRes = await request('PATCH', `/api/customers/${customerId}`, {
      nombre: 'Cliente Actualizado',
      email: 'updated@solanium.dev',
    });
    assert(updateRes.ok && updateRes.body.data?.email === 'updated@solanium.dev', 'PATCH /api/customers/:id — actualiza');
  }

  // DELETE
  if (customerId) {
    const deleteRes = await request('DELETE', `/api/customers/${customerId}`);
    assert(deleteRes.ok && deleteRes.body.deleted === true, 'DELETE /api/customers/:id — elimina');
  }
}

async function testTemplates() {
  console.log('\n🎨 Templates CRUD + Presets');

  // LIST PRESETS (público, sin tenant)
  const presetsRes = await fetch(`${BASE}/api/templates/presets`);
  const presetsData = await presetsRes.json();
  assert(presetsRes.ok && Array.isArray(presetsData.data), 'GET /api/templates/presets — lista presets');
  assert(presetsData.data.length >= 3, 'Hay al menos 3 presets disponibles');

  // APPLY PRESET
  const applyRes = await request('POST', '/api/templates/apply-preset', { slug: 'neon-tech' });
  assert(applyRes.ok && applyRes.body.data?.slug === 'neon-tech', 'POST /api/templates/apply-preset — aplica preset neon-tech');

  // CREATE personalizado
  const createRes = await request('POST', '/api/templates', {
    slug: 'test-plantilla',
    nombre: 'Plantilla Test API',
    descripcion: 'Creada desde test automatizado',
    is_default: false,
    theme: {
      accent: '#ff6600',
      gradient_from: '#ff6600',
      gradient_to: '#ff0066',
      font: 'mono',
      layout: 'compact',
      logo_position: 'center',
    },
    defaults: {
      impuesto_pct: 19,
      metodo_pago: 'tarjeta',
      moneda: 'COP',
      notas: 'Test automático',
    },
  });
  assert(createRes.ok && createRes.body.data?.id, 'POST /api/templates — crea plantilla personalizada');
  const templateId = createRes.body.data?.id;

  // LIST
  const listRes = await request('GET', '/api/templates');
  assert(listRes.ok && Array.isArray(listRes.body.data), 'GET /api/templates — lista plantillas del tenant');

  // UPDATE
  if (templateId) {
    const updateRes = await request('PATCH', `/api/templates/${templateId}`, {
      nombre: 'Plantilla Actualizada',
    });
    assert(updateRes.ok && updateRes.body.data?.nombre === 'Plantilla Actualizada', 'PATCH /api/templates/:id — actualiza');
  }

  // DELETE
  if (templateId) {
    const deleteRes = await request('DELETE', `/api/templates/${templateId}`);
    assert(deleteRes.ok && deleteRes.body.deleted === true, 'DELETE /api/templates/:id — elimina');
  }

  // Limpiar el preset aplicado
  const applied = (await request('GET', '/api/templates')).body.data?.find((t) => t.slug === 'neon-tech');
  if (applied) {
    await request('DELETE', `/api/templates/${applied.id}`);
  }
}

async function testInvoices() {
  console.log('\n🧾 Invoices CRUD + Stock + Summary');

  // Primero crear un producto y un cliente para referenciar
  const productRes = await request('POST', '/api/products', {
    sku: 'INV-TEST-001',
    nombre: 'Producto para Factura',
    precio: 5000,
    stock: 100,
    unidad: 'unidad',
    metadata: { presentacion: 'Caja x 10' },
  });
  const productId = productRes.body.data?.id;
  const initialStock = Number(productRes.body.data?.stock || 0);

  const customerRes = await request('POST', '/api/customers', {
    nombre: 'Cliente Factura Test',
    documento: 'FACT-999',
  });
  const customerId = customerRes.body.data?.id;

  // CREATE INVOICE
  const createRes = await request('POST', '/api/invoices', {
    customer_id: customerId,
    metodo_pago: 'efectivo',
    notas: 'Factura de prueba',
    items: [
      {
        product_id: productId,
        sku: 'INV-TEST-001',
        nombre: 'Producto para Factura',
        unidad: 'unidad',
        cantidad: 3,
        precio_unitario: 5000,
      },
    ],
  });
  assert(createRes.ok && createRes.body.data?.id, 'POST /api/invoices — crea factura');
  assert(createRes.body.data?.numero?.startsWith('F-'), 'Número de factura tiene formato F-XXXXXX');
  const invoiceId = createRes.body.data?.id;

  // Verificar que el stock disminuyó
  if (productId) {
    const prodCheck = await request('GET', `/api/products?search=INV-TEST-001`);
    const prod = prodCheck.body.data?.find((p) => p.id === productId);
    if (prod) {
      assert(
        Number(prod.stock) === initialStock - 3,
        `Stock decrementado: ${initialStock} → ${Number(prod.stock)} (esperado ${initialStock - 3})`
      );
    }
  }

  // GET by ID con items
  if (invoiceId) {
    const getRes = await request('GET', `/api/invoices/${invoiceId}`);
    assert(getRes.ok && Array.isArray(getRes.body.data?.items), 'GET /api/invoices/:id — retorna items');
    assert(getRes.body.data?.items?.length === 1, 'La factura tiene 1 item');
    assert(Number(getRes.body.data?.total) === 15000, 'Total calculado correctamente: 5000 × 3 = 15000');
  }

  // LIST con filtros
  const listRes = await request('GET', '/api/invoices?limit=5');
  assert(listRes.ok && Array.isArray(listRes.body.data), 'GET /api/invoices — lista facturas');

  // UPDATE estado
  if (invoiceId) {
    const updateRes = await request('PATCH', `/api/invoices/${invoiceId}`, {
      estado: 'pagada',
    });
    assert(updateRes.ok && updateRes.body.data?.estado === 'pagada', 'PATCH /api/invoices/:id — cambia estado a pagada');
  }

  // SUMMARY
  const summaryRes = await request('GET', '/api/invoices/summary');
  assert(summaryRes.ok && summaryRes.body.data?.count_total >= 1, 'GET /api/invoices/summary — retorna métricas');

  // DELETE
  if (invoiceId) {
    const deleteRes = await request('DELETE', `/api/invoices/${invoiceId}`);
    assert(deleteRes.ok && deleteRes.body.deleted === true, 'DELETE /api/invoices/:id — elimina factura (cascade items)');
  }

  // Limpiar datos de prueba
  if (productId) await request('DELETE', `/api/products/${productId}`);
  if (customerId) await request('DELETE', `/api/customers/${customerId}`);
}

async function testActivationAndOnboarding() {
  console.log('\n🔑 Activation & Onboarding SaaS');

  // 1. Onboarding: super-admin crea tenant nuevo + elige plantilla + branding
  const newSlug = `tenant-test-${Date.now()}`;
  const onboardRes = await superRequest('POST', '/api/activation/onboard', {
    new_tenant: {
      slug: newSlug,
      nombre: 'Empresa Demo Solanium',
      tipo_negocio: 'generico',
    },
    template_slug: 'midnight-minimal',
    branding: {
      empresa: 'Empresa Demo Solanium',
      eslogan: 'Factura bonito, cobra rápido',
      logo_url: 'https://cdn.solanium.dev/logo-demo.png',
      color_primario: '#7c5cff',
      color_secundario: '#22d3ee',
    },
    plan: 'trial',
    duracion_dias: 30,
  });
  assert(onboardRes.ok && onboardRes.body.data?.token, 'POST /api/activation/onboard — emite token');
  assert(onboardRes.body.data?.tenant?.slug === newSlug, 'El tenant creado tiene el slug solicitado');
  assert(onboardRes.body.data?.tenant?.branding?.empresa === 'Empresa Demo Solanium', 'Branding guardado correctamente');
  assert(onboardRes.body.data?.template?.slug === 'midnight-minimal', 'Plantilla seleccionada aplicada y marcada default');

  const token = onboardRes.body.data?.token;
  const activationId = onboardRes.body.data?.activation?.id;
  const expiresAt = onboardRes.body.data?.activation?.expires_at;

  // 2. Validar que el token expira ~30 días después (con tolerancia de 1 día)
  if (expiresAt) {
    const diffDays = Math.round((new Date(expiresAt) - Date.now()) / 86400000);
    assert(diffDays >= 29 && diffDays <= 31, `Token expira en ~30 días (calculado: ${diffDays})`);
  }

  // 3. Verificar token (endpoint público)
  const verifyRes = await fetch(`${BASE}/api/activation/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const verifyData = await verifyRes.json();
  assert(verifyRes.ok && verifyData.data?.valid === true, 'POST /api/activation/verify — token válido');

  // 4. Usar el Bearer en requests subsiguientes
  ACTIVE_TOKEN = token;
  const meRes = await request('GET', '/api/users/me');
  assert(meRes.ok && meRes.body.data?.tenant?.slug === newSlug, 'GET /api/users/me — resuelve tenant desde Bearer');

  // 5. Listar tokens propios
  const mineRes = await request('GET', '/api/activation/mine');
  assert(mineRes.ok && Array.isArray(mineRes.body.data) && mineRes.body.data.length >= 1, 'GET /api/activation/mine — lista tokens del tenant');

  // 6. Renovar token (super-admin)
  if (activationId) {
    const renewRes = await superRequest('POST', `/api/activation/${activationId}/renew`, { duracion_dias: 60 });
    assert(renewRes.ok && renewRes.body.data?.expires_at, 'POST /api/activation/:id/renew — actualiza expires_at');
  }

  // Dejamos ACTIVE_TOKEN seteado para que el resto de tests usen Bearer
}

async function testUsers() {
  console.log('\n👤 Users CRUD + Login');

  // CREATE (dentro del tenant actual — requiere Bearer ya seteado)
  const uniqueEmail = `op-${Date.now()}@solanium.dev`;
  const createRes = await request('POST', '/api/users', {
    email: uniqueEmail,
    nombre: 'Operador Test',
    password: 'superSecret123',
    role: 'operador',
  });
  assert(createRes.ok && createRes.body.data?.id, 'POST /api/users — crea usuario operador');
  assert(createRes.body.data && !createRes.body.data.password_hash, 'La respuesta NO expone password_hash');
  const userId = createRes.body.data?.id;

  // No se puede crear super_admin desde un tenant
  const forbiddenRes = await request('POST', '/api/users', {
    email: `sa-${Date.now()}@solanium.dev`,
    nombre: 'Hack Attempt',
    password: 'superSecret123',
    role: 'super_admin',
  });
  assert(forbiddenRes.status === 403, 'POST /api/users con role=super_admin — bloqueado (403)');

  // LIST
  const listRes = await request('GET', '/api/users');
  assert(listRes.ok && Array.isArray(listRes.body.data), 'GET /api/users — lista usuarios del tenant');

  // LOGIN del usuario recién creado
  // Para el login necesitamos conocer el slug del tenant activo: lo pedimos a /me
  const meRes = await request('GET', '/api/users/me');
  const activeSlug = meRes.body.data?.tenant?.slug;
  const loginRes = await fetch(`${BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'superSecret123',
      tenant_slug: activeSlug,
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.ok && loginData.data?.user?.id === userId, 'POST /api/users/login — autentica al operador');

  // UPDATE (cambio de nombre)
  if (userId) {
    const updateRes = await request('PATCH', `/api/users/${userId}`, { nombre: 'Operador Actualizado' });
    assert(updateRes.ok && updateRes.body.data?.nombre === 'Operador Actualizado', 'PATCH /api/users/:id — actualiza');
  }

  // DELETE
  if (userId) {
    const deleteRes = await request('DELETE', `/api/users/${userId}`);
    assert(deleteRes.ok && deleteRes.body.deleted === true, 'DELETE /api/users/:id — elimina usuario');
  }
}

/* =====================================================================
 * Runner principal
 * ===================================================================== */
async function run() {
  console.log('═══════════════════════════════════════════');
  console.log('  🧪 Solanium API Test Suite');
  console.log(`  Base: ${BASE}`);
  console.log(`  Tenant: ${TENANT_SLUG}`);
  console.log('═══════════════════════════════════════════');

  try {
    await testHealth();
    await testTenants();
    await testActivationAndOnboarding();
    await testUsers();
    await testProducts();
    await testCustomers();
    await testTemplates();
    await testInvoices();
  } catch (err) {
    console.error('\n💥 Error fatal durante las pruebas:', err.message);
    failed++;
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(`  Resultados: ${passed} ✓  ${failed} ✗`);
  if (errors.length > 0) {
    console.log(`\n  Fallaron:`);
    errors.forEach((e) => console.log(`    ✗ ${e}`));
  }
  console.log('═══════════════════════════════════════════\n');

  process.exit(failed > 0 ? 1 : 0);
}

run();
