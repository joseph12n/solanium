'use client';

/**
 * SessionProvider — reemplaza al viejo TenantProvider.
 *
 * Persistencia (localStorage):
 *   solanium.token    → activation_token vigente (Bearer)
 *   solanium.user     → snapshot del usuario logueado
 *   solanium.tenant   → snapshot del tenant resuelto desde /activation/verify
 *   solanium.template → plantilla activa (skin completo del app)
 *
 * Al montar, lee el token y re-verifica contra el backend para garantizar
 * que siga vigente. Al tener tenant, busca la plantilla default del tenant
 * y la expone como `activeTemplate` — el LayoutShell inyecta sus tokens
 * visuales como CSS vars + data attrs para pintar toda la UI.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  api,
  sessionStore,
  type SessionUser,
  type Tenant,
  type ActivationSummary,
  type InvoiceTemplate,
} from './api';

const STORAGE = {
  token: 'solanium.token',
  user: 'solanium.user',
  tenant: 'solanium.tenant',
  template: 'solanium.template',
};

export interface SessionValue {
  token: string | null;
  tenant: Tenant | null;
  user: SessionUser | null;
  activation: ActivationSummary | null;
  activeTemplate: InvoiceTemplate | null;
  loading: boolean;
  login: (input: {
    code: string;
    email?: string;
    password?: string;
  }) => Promise<{ tenant: Tenant; user: SessionUser | null }>;
  logout: () => void;
  updateTenant: (patch: Partial<Tenant>) => void;
  setActiveTemplate: (tpl: InvoiceTemplate | null) => void;
  refreshTemplate: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | undefined>(undefined);

const PUBLIC_PATHS = ['/login'];

function readLocal<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  if (value === null || value === undefined) window.localStorage.removeItem(key);
  else window.localStorage.setItem(key, JSON.stringify(value));
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [token, setToken] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [activation, setActivation] = useState<ActivationSummary | null>(null);
  const [activeTemplate, setActiveTemplateState] = useState<InvoiceTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveTemplate = useCallback(async () => {
    try {
      const { data } = await api.listTemplates();
      const def = data.find((t) => t.is_default) || data[0] || null;
      setActiveTemplateState(def);
      writeLocal(STORAGE.template, def);
    } catch {
      // Sin plantilla — se mantiene el skin por defecto
    }
  }, []);

  // Hidratación inicial desde localStorage + re-verificación del token
  useEffect(() => {
    const storedToken =
      typeof window === 'undefined' ? null : window.localStorage.getItem(STORAGE.token);
    const storedUser = readLocal<SessionUser>(STORAGE.user);
    const storedTemplate = readLocal<InvoiceTemplate>(STORAGE.template);

    if (storedTemplate) setActiveTemplateState(storedTemplate);

    if (!storedToken) {
      setLoading(false);
      return;
    }

    sessionStore.token = storedToken;
    sessionStore.userId = storedUser?.id ?? null;

    (async () => {
      try {
        const { data } = await api.verifyActivation(storedToken);
        setToken(storedToken);
        setTenant(data.tenant);
        setActivation(data.activation);
        writeLocal(STORAGE.tenant, data.tenant);
        if (storedUser) setUser(storedUser);
        // Refrescar plantilla activa en segundo plano
        fetchActiveTemplate();
      } catch {
        sessionStore.token = null;
        sessionStore.userId = null;
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(STORAGE.token);
          window.localStorage.removeItem(STORAGE.user);
          window.localStorage.removeItem(STORAGE.tenant);
          window.localStorage.removeItem(STORAGE.template);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchActiveTemplate]);

  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.includes(pathname);
    if (!token && !isPublic) router.replace('/login');
    if (token && isPublic) router.replace('/');
  }, [loading, token, pathname, router]);

  const login = useCallback(
    async ({
      code,
      email,
      password,
    }: {
      code: string;
      email?: string;
      password?: string;
    }) => {
      const verifyRes = await api.verifyActivation(code);
      const { tenant: newTenant, activation: newActivation } = verifyRes.data;
      const sessionToken = newActivation.session_token;
      if (!sessionToken) {
        throw new Error('El backend no devolvió un session_token válido');
      }

      let newUser: SessionUser | null = null;
      if (email && password) {
        const loginRes = await api.login({
          email,
          password,
          tenant_slug: newTenant.slug,
        });
        newUser = loginRes.data.user;
      }

      sessionStore.token = sessionToken;
      sessionStore.userId = newUser?.id ?? null;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE.token, sessionToken);
      }
      writeLocal(STORAGE.user, newUser);
      writeLocal(STORAGE.tenant, newTenant);

      setToken(sessionToken);
      setTenant(newTenant);
      setActivation(newActivation);
      setUser(newUser);

      fetchActiveTemplate();

      return { tenant: newTenant, user: newUser };
    },
    [fetchActiveTemplate]
  );

  const logout = useCallback(() => {
    sessionStore.token = null;
    sessionStore.userId = null;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE.token);
      window.localStorage.removeItem(STORAGE.user);
      window.localStorage.removeItem(STORAGE.tenant);
      window.localStorage.removeItem(STORAGE.template);
    }
    setToken(null);
    setTenant(null);
    setUser(null);
    setActivation(null);
    setActiveTemplateState(null);
    router.replace('/login');
  }, [router]);

  const updateTenant = useCallback((patch: Partial<Tenant>) => {
    setTenant((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch, branding: { ...prev.branding, ...patch.branding } };
      writeLocal(STORAGE.tenant, next);
      return next;
    });
  }, []);

  const setActiveTemplate = useCallback((tpl: InvoiceTemplate | null) => {
    setActiveTemplateState(tpl);
    writeLocal(STORAGE.template, tpl);
  }, []);

  const refreshTemplate = useCallback(async () => {
    await fetchActiveTemplate();
  }, [fetchActiveTemplate]);

  const value = useMemo<SessionValue>(
    () => ({
      token,
      tenant,
      user,
      activation,
      activeTemplate,
      loading,
      login,
      logout,
      updateTenant,
      setActiveTemplate,
      refreshTemplate,
    }),
    [token, tenant, user, activation, activeTemplate, loading, login, logout, updateTenant, setActiveTemplate, refreshTemplate]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return ctx;
}
