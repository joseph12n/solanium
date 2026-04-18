'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api, type Tenant } from './api';

interface TenantContextValue {
  tenants: Tenant[];
  active: Tenant | null;
  setActiveSlug: (slug: string) => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

const STORAGE_KEY = 'solanium.active-tenant-slug';

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [active, setActive] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.listTenants();
        setTenants(data);
        const savedSlug =
          typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
        const initial =
          data.find((t) => t.slug === savedSlug) ||
          data.find((t) => t.slug === process.env.NEXT_PUBLIC_DEFAULT_TENANT_SLUG) ||
          data[0] ||
          null;
        setActive(initial);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const setActiveSlug = (slug: string) => {
    const next = tenants.find((t) => t.slug === slug) || null;
    setActive(next);
    if (typeof window !== 'undefined' && next) {
      window.localStorage.setItem(STORAGE_KEY, next.slug);
    }
  };

  return (
    <TenantContext.Provider value={{ tenants, active, setActiveSlug, loading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error('useTenant debe usarse dentro de <TenantProvider>');
  return ctx;
}
