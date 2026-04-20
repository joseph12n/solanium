/* =====================================================================
 * API client — cliente tipado que envía Authorization: Bearer <token>
 * automáticamente en cada request autenticada. El token se resuelve
 * desde el `session-context` vía sessionStore (ver session-context.tsx)
 * o puede pasarse explícito en init.token (para login flow).
 * ===================================================================== */

export type TipoNegocio = 'papeleria' | 'carniceria' | 'electronica' | 'generico';
export type UserRole = 'super_admin' | 'admin' | 'operador' | 'solo_lectura';
export type PlanKind = 'trial' | 'starter' | 'pro' | 'enterprise';

export interface Branding {
  empresa?: string;
  eslogan?: string;
  logo_url?: string;
  color_primario?: string;
  color_secundario?: string;
  website?: string;
  direccion?: string;
  telefono?: string;
  [k: string]: unknown;
}

export interface Tenant {
  id: string;
  slug: string;
  nombre: string;
  tipo_negocio: TipoNegocio;
  activo: boolean;
  branding?: Branding;
  plan?: PlanKind;
  settings?: Record<string, unknown>;
}

export interface SessionUser {
  id: string;
  tenant_id: string | null;
  email: string;
  nombre: string;
  role: UserRole;
  activo: boolean;
  last_login_at?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ActivationSummary {
  id: string;
  plan: PlanKind;
  template_slug: string;
  expires_at: string;
}

export interface VerifyResponse {
  valid: true;
  tenant: Tenant;
  activation: ActivationSummary;
}

export interface Product {
  id: string;
  tenant_id: string;
  sku: string;
  nombre: string;
  descripcion?: string | null;
  precio: number | string;
  stock: number | string;
  unidad: string;
  activo: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  nombre: string;
  documento?: string | null;
  email?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  activo: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface InvoiceTemplateTheme {
  accent: string;
  gradient_from: string;
  gradient_to: string;
  font?: 'inter' | 'mono' | 'serif';
  layout?: 'modern' | 'compact' | 'minimal' | 'classic';
  logo_position?: 'left' | 'center' | 'right';
  logo_url?: string;
  [k: string]: unknown;
}

export interface InvoiceTemplate {
  id: string;
  tenant_id: string;
  slug: string;
  nombre: string;
  descripcion?: string | null;
  is_default: boolean;
  theme: InvoiceTemplateTheme;
  defaults: {
    impuesto_pct?: number;
    metodo_pago?: string;
    moneda?: string;
    notas?: string;
    [k: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface TemplatePreset {
  slug: string;
  nombre: string;
  descripcion: string;
  theme: InvoiceTemplateTheme;
  defaults: InvoiceTemplate['defaults'];
}

export interface InvoiceItem {
  id?: string;
  invoice_id?: string;
  product_id?: string | null;
  sku: string;
  sku_snapshot?: string;
  nombre: string;
  nombre_snapshot?: string;
  unidad: string;
  unidad_snapshot?: string;
  cantidad: number | string;
  precio_unitario: number | string;
  descuento_unit?: number;
  subtotal?: number | string;
  metadata?: Record<string, unknown>;
  orden?: number;
}

export type InvoiceEstado = 'borrador' | 'emitida' | 'pagada' | 'anulada';

export interface Invoice {
  id: string;
  tenant_id: string;
  numero: string;
  customer_id?: string | null;
  template_id?: string | null;
  estado: InvoiceEstado;
  metodo_pago: string;
  moneda: string;
  subtotal: number | string;
  impuesto_pct: number | string;
  impuesto_total: number | string;
  descuento: number | string;
  total: number | string;
  notas?: string | null;
  metadata: Record<string, unknown>;
  emitida_en: string;
  created_at: string;
  updated_at: string;
  items?: InvoiceItem[];
  cliente_nombre?: string | null;
  cliente_documento?: string | null;
  items_count?: number;
}

export interface InvoiceSummary {
  count_total: number;
  ingresos_total: number | string;
  ingresos_hoy: number | string;
  ingresos_mes: number | string;
  count_hoy: number;
}

export interface CreateInvoicePayload {
  customer_id?: string | null;
  template_id?: string | null;
  estado?: InvoiceEstado;
  metodo_pago?: string;
  moneda?: string;
  impuesto_pct?: number;
  descuento?: number;
  notas?: string;
  metadata?: Record<string, unknown>;
  items: Array<{
    product_id?: string | null;
    sku: string;
    nombre: string;
    unidad?: string;
    cantidad: number;
    precio_unitario: number;
    descuento_unit?: number;
    metadata?: Record<string, unknown>;
  }>;
}

const BASE = '/api/backend';

/* ---------------------------------------------------------------------
 * sessionStore — bolsa mutable donde el session-context deja el Bearer
 * actual. Lo consulta `request()` sin necesidad de pasarlo explícito.
 * --------------------------------------------------------------------- */
export const sessionStore = {
  token: null as string | null,
  userId: null as string | null,
};

export interface RequestOptions extends RequestInit {
  token?: string;
  userId?: string;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status?: number;
  code?: string;
  details?: unknown;
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const { token, userId, skipAuth, headers, ...rest } = init;
  const bearer = token ?? sessionStore.token;
  const uid = userId ?? sessionStore.userId;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(!skipAuth && bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...(uid ? { 'x-user-id': uid } : {}),
      ...(headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({} as Record<string, unknown>));
    const err = new ApiError(
      (body.message as string) || `Request failed: ${res.status}`
    );
    err.status = res.status;
    err.code = body.error as string | undefined;
    err.details = body.details;
    throw err;
  }
  return res.json();
}

export const api = {
  // ─── Activación (SaaS) ─────────────────────────────────────────────
  verifyActivation: (token: string) =>
    request<{ data: VerifyResponse }>('/activation/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
      skipAuth: true,
    }),

  // ─── Users ─────────────────────────────────────────────────────────
  login: (payload: { email: string; password: string; tenant_slug?: string }) =>
    request<{ data: { user: SessionUser; tenant: Tenant | null } }>(
      '/users/login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
      }
    ),
  me: () => request<{ data: { tenant: Tenant; activation: ActivationSummary | null } }>('/users/me'),
  listUsers: () => request<{ data: SessionUser[] }>('/users'),
  createUser: (payload: Partial<SessionUser> & { password: string }) =>
    request<{ data: SessionUser }>('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateUser: (id: string, payload: Partial<SessionUser> & { password?: string }) =>
    request<{ data: SessionUser }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteUser: (id: string) =>
    request<{ deleted: boolean }>(`/users/${id}`, { method: 'DELETE' }),

  // ─── Tenants ───────────────────────────────────────────────────────
  listTenants: () => request<{ data: Tenant[] }>('/tenants', { skipAuth: true }),
  currentTenant: () => request<{ data: Tenant }>('/tenants/current'),

  // ─── Products ──────────────────────────────────────────────────────
  listProducts: (opts?: { search?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (opts?.search) qs.set('search', opts.search);
    if (opts?.limit) qs.set('limit', String(opts.limit));
    const suffix = qs.toString() ? `?${qs}` : '';
    return request<{
      data: Product[];
      tenant: { id: string; tipo_negocio: TipoNegocio };
    }>(`/products${suffix}`);
  },
  createProduct: (payload: Partial<Product>) =>
    request<{ data: Product }>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateProduct: (id: string, payload: Partial<Product>) =>
    request<{ data: Product }>(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id: string) =>
    request<{ deleted: boolean }>(`/products/${id}`, { method: 'DELETE' }),

  // ─── Customers ─────────────────────────────────────────────────────
  listCustomers: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<{ data: Customer[] }>(`/customers${qs}`);
  },
  getCustomer: (id: string) => request<{ data: Customer }>(`/customers/${id}`),
  createCustomer: (payload: Partial<Customer>) =>
    request<{ data: Customer }>('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCustomer: (id: string, payload: Partial<Customer>) =>
    request<{ data: Customer }>(`/customers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteCustomer: (id: string) =>
    request<{ deleted: boolean }>(`/customers/${id}`, { method: 'DELETE' }),

  // ─── Templates ─────────────────────────────────────────────────────
  listTemplates: () => request<{ data: InvoiceTemplate[] }>('/templates'),
  listPresets: () =>
    request<{ data: TemplatePreset[] }>('/templates/presets', { skipAuth: true }),
  applyPreset: (presetSlug: string) =>
    request<{ data: InvoiceTemplate }>('/templates/apply-preset', {
      method: 'POST',
      body: JSON.stringify({ slug: presetSlug }),
    }),
  createTemplate: (payload: Partial<InvoiceTemplate>) =>
    request<{ data: InvoiceTemplate }>('/templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateTemplate: (id: string, payload: Partial<InvoiceTemplate>) =>
    request<{ data: InvoiceTemplate }>(`/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteTemplate: (id: string) =>
    request<{ deleted: boolean }>(`/templates/${id}`, { method: 'DELETE' }),

  // ─── Invoices ──────────────────────────────────────────────────────
  listInvoices: (opts?: { estado?: string; search?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (opts?.estado) qs.set('estado', opts.estado);
    if (opts?.search) qs.set('search', opts.search);
    if (opts?.limit) qs.set('limit', String(opts.limit));
    const suffix = qs.toString() ? `?${qs}` : '';
    return request<{ data: Invoice[] }>(`/invoices${suffix}`);
  },
  getInvoice: (id: string) => request<{ data: Invoice }>(`/invoices/${id}`),
  createInvoice: (payload: CreateInvoicePayload) =>
    request<{ data: Invoice }>('/invoices', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateInvoice: (id: string, payload: Partial<Invoice>) =>
    request<{ data: Invoice }>(`/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deleteInvoice: (id: string) =>
    request<{ deleted: boolean }>(`/invoices/${id}`, { method: 'DELETE' }),
  invoiceSummary: () => request<{ data: InvoiceSummary }>('/invoices/summary'),
};
