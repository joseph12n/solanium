'use client';

/**
 * SessionProvider — reemplaza al viejo TenantProvider.
 *
 * Persistencia (localStorage):
 *   solanium.token    → activation_token vigente (Bearer)
 *   solanium.user     → snapshot del usuario logueado
 *   solanium.tenant   → snapshot del tenant resuelto desde /activation/verify
 *
 * Al montar, lee el token y re-verifica contra el backend para garantizar
 * que siga vigente (no expirado / no revocado). Si falla, limpia la sesión
 * y manda a /login. Las páginas autenticadas consumen `useSession()` para
 * obtener tenant, branding y usuario; el api-client lee el token desde
 * `sessionStore` (ver lib/api.ts) sin necesidad de pasarlo manualmente.
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
import { api, sessionStore, type SessionUser, type Tenant, type ActivationSummary } from './api';

const STORAGE = {
  token: 'solanium.token',
  user: 'solanium.user',
  tenant: 'solanium.tenant',
};

export interface SessionValue {
  token: string | null;
  tenant: Tenant | null;
  user: SessionUser | null;
  activation: ActivationSummary | null;
  loading: boolean;
  login: (input: {
    token: string;
    email?: string;
    password?: string;
  }) => Promise<{ tenant: Tenant; user: SessionUser | null }>;
  logout: () => void;
  updateTenant: (patch: Partial<Tenant>) => void;
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
  const [loading, setLoading] = useState(true);

  // Hidratación inicial desde localStorage + re-verificación del token
  useEffect(() => {
    const storedToken =
      typeof window === 'undefined' ? null : window.localStorage.getItem(STORAGE.token);
    const storedUser = readLocal<SessionUser>(STORAGE.user);

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
      } catch {
        // Token inválido o expirado — limpiar todo
        sessionStore.token = null;
        sessionStore.userId = null;
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(STORAGE.token);
          window.localStorage.removeItem(STORAGE.user);
          window.localStorage.removeItem(STORAGE.tenant);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Route guard: redirige a /login si no hay sesión en ruta privada
  useEffect(() => {
    if (loading) return;
    const isPublic = PUBLIC_PATHS.includes(pathname);
    if (!token && !isPublic) router.replace('/login');
    if (token && isPublic) router.replace('/');
  }, [loading, token, pathname, router]);

  const login = useCallback(
    async ({
      token: activationToken,
      email,
      password,
    }: {
      token: string;
      email?: string;
      password?: string;
    }) => {
      // 1. Verificar el activation token — trae tenant + branding
      const verifyRes = await api.verifyActivation(activationToken);
      const { tenant: newTenant, activation: newActivation } = verifyRes.data;

      // 2. Si vienen credenciales, login del usuario dentro de ese tenant
      let newUser: SessionUser | null = null;
      if (email && password) {
        const loginRes = await api.login({
          email,
          password,
          tenant_slug: newTenant.slug,
        });
        newUser = loginRes.data.user;
      }

      // 3. Persistir sesión
      sessionStore.token = activationToken;
      sessionStore.userId = newUser?.id ?? null;
      writeLocal(STORAGE.token, null);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE.token, activationToken);
      }
      writeLocal(STORAGE.user, newUser);
      writeLocal(STORAGE.tenant, newTenant);

      setToken(activationToken);
      setTenant(newTenant);
      setActivation(newActivation);
      setUser(newUser);

      return { tenant: newTenant, user: newUser };
    },
    []
  );

  const logout = useCallback(() => {
    sessionStore.token = null;
    sessionStore.userId = null;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE.token);
      window.localStorage.removeItem(STORAGE.user);
      window.localStorage.removeItem(STORAGE.tenant);
    }
    setToken(null);
    setTenant(null);
    setUser(null);
    setActivation(null);
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

  const value = useMemo<SessionValue>(
    () => ({ token, tenant, user, activation, loading, login, logout, updateTenant }),
    [token, tenant, user, activation, loading, login, logout, updateTenant]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return ctx;
}
