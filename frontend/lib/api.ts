export type TipoNegocio = 'papeleria' | 'carniceria' | 'electronica' | 'generico';

export interface Tenant {
  id: string;
  slug: string;
  nombre: string;
  tipo_negocio: TipoNegocio;
  activo: boolean;
  settings?: Record<string, unknown>;
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

const BASE = '/api/backend';

async function request<T>(path: string, init: RequestInit & { tenantSlug?: string } = {}): Promise<T> {
  const { tenantSlug, headers, ...rest } = init;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(tenantSlug ? { 'x-tenant-slug': tenantSlug } : {}),
      ...(headers || {}),
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  listTenants: () => request<{ data: Tenant[] }>('/tenants'),
  currentTenant: (slug: string) => request<{ data: Tenant }>('/tenants/current', { tenantSlug: slug }),
  listProducts: (slug: string) =>
    request<{ data: Product[]; tenant: { id: string; tipo_negocio: TipoNegocio } }>(
      '/products',
      { tenantSlug: slug }
    ),
  createProduct: (slug: string, payload: Partial<Product>) =>
    request<{ data: Product }>('/products', {
      method: 'POST',
      tenantSlug: slug,
      body: JSON.stringify(payload),
    }),
};
