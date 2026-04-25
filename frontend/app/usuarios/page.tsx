'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit3,
  Mail,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  UserPlus,
} from 'lucide-react';
import { api, type SessionUser, type UserRole } from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { useLanguage } from '@/lib/language-context';
import { ShineButton } from '@/components/ui/ShineButton';
import { Modal } from '@/components/ui/Modal';
import { addToast } from '@/components/ui/Toaster';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import SplitText from '@/components/reactbits/SplitText';

const EASE = [0.23, 1, 0.32, 1] as const;

const ROLE_OPTIONS: UserRole[] = ['admin', 'operador', 'solo_lectura'];

function randomPassword(length = 12) {
  const charset = 'ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  return Array.from(
    { length },
    () => charset[Math.floor(Math.random() * charset.length)]
  ).join('');
}

export default function UsuariosPage() {
  const { tenant, user: currentUser } = useSession();
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState<SessionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SessionUser | null>(null);
  const [newCredential, setNewCredential] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    role: 'operador' as UserRole,
    password: '',
  });

  const resetForm = () => {
    setForm({ nombre: '', email: '', role: 'operador', password: '' });
    setEditing(null);
  };

  const tenantId = tenant?.id;
  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.listUsers();
      setUsers(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error cargando usuarios';
      setError(msg);
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) => u.nombre.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, search]);

  function openInvite() {
    resetForm();
    setForm((f) => ({ ...f, password: randomPassword() }));
    setShowForm(true);
  }

  function openEdit(u: SessionUser) {
    setEditing(u);
    setForm({ nombre: u.nombre, email: u.email, role: u.role, password: '' });
    setShowForm(true);
  }

  async function save() {
    if (!form.nombre.trim() || !form.email.trim()) {
      addToast('error', t('common.name'));
      return;
    }
    try {
      if (editing) {
        const payload: Partial<SessionUser> & { password?: string } = {
          nombre: form.nombre,
          email: form.email,
          role: form.role,
        };
        if (form.password) payload.password = form.password;
        await api.updateUser(editing.id, payload);
        addToast('success', form.email);
      } else {
        if (!form.password) {
          addToast('error', t('common.password'));
          return;
        }
        await api.createUser({
          nombre: form.nombre,
          email: form.email,
          role: form.role,
          password: form.password,
        });
        setNewCredential({ email: form.email, password: form.password });
      }
      setShowForm(false);
      resetForm();
      load();
    } catch (err: any) {
      addToast('error', err.message || 'Error');
    }
  }

  async function remove(u: SessionUser) {
    if (u.id === currentUser?.id) {
      addToast('error', '—');
      return;
    }
    if (!confirm(`${t('common.delete')} ${u.email}?`)) return;
    try {
      await api.deleteUser(u.id);
      addToast('success', u.email);
      load();
    } catch (err: any) {
      addToast('error', err.message || 'Error');
    }
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="flex items-end justify-between mb-8 flex-wrap gap-3"
      >
        <div>
          <span
            className="text-[11px] uppercase tracking-[0.2em] font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('users.title')}
          </span>
          <SplitText
            text={t('users.title')}
            tag="h1"
            className="text-3xl font-bold tracking-tight mt-1"
            delay={0.03}
          />
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {users.length}
          </p>
        </div>
        <ShineButton onClick={openInvite} icon={<UserPlus size={14} />}>
          {t('users.invite')}
        </ShineButton>
      </motion.div>

      <ErrorBanner
        error={error}
        onRetry={load}
        onDismiss={() => setError(null)}
      />

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--text-muted)' }}
        />
        <input
          type="text"
          placeholder={t('common.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9"
        />
      </div>

      {/* Table */}
      <section
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border-subtle)' }}
      >
        {loading ? (
          <SkeletonRows />
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>
            <User size={28} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t('users.title')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-[11px] uppercase tracking-[0.15em]"
                  style={{
                    background: 'rgb(var(--surface-raised) / 0.5)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <th className="px-4 py-3 font-medium">{t('common.name')}</th>
                  <th className="px-4 py-3 font-medium">{t('common.role')}</th>
                  <th className="px-4 py-3 font-medium">{t('users.lastLogin')}</th>
                  <th className="px-4 py-3 font-medium text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.3), ease: EASE }}
                    className="border-t group"
                    style={{ borderColor: 'var(--border-subtle)' }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm"
                          style={{
                            background:
                              'linear-gradient(135deg, rgb(var(--brand-primary) / 0.18), rgb(var(--brand-secondary) / 0.18))',
                            color: 'rgb(var(--brand-primary))',
                          }}
                        >
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{u.nombre}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {u.last_login_at
                        ? new Date(u.last_login_at).toLocaleString(lang === 'es' ? 'es-MX' : 'en-US', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : t('users.neverLogged')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition">
                        <IconBtn onClick={() => openEdit(u)} icon={<Edit3 size={13} />} />
                        <IconBtn
                          onClick={() => remove(u)}
                          icon={<Trash2 size={13} />}
                          tone="danger"
                          disabled={u.id === currentUser?.id}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Form modal */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title={editing ? t('common.edit') : t('users.invite')}
      >
        <div className="space-y-4">
          <FormField label={t('common.name')}>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full"
              autoFocus
            />
          </FormField>
          <FormField label={t('common.email')}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full"
            />
          </FormField>
          <FormField label={t('common.role')}>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((r) => (
                <RolePill
                  key={r}
                  role={r}
                  active={form.role === r}
                  onClick={() => setForm((f) => ({ ...f, role: r }))}
                />
              ))}
            </div>
          </FormField>
          <FormField label={t('common.password')}>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={editing ? '—' : ''}
                className="w-full font-mono"
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, password: randomPassword() }))}
                className="text-xs px-3 rounded-lg whitespace-nowrap"
                style={{
                  background: 'rgb(var(--brand-primary) / 0.1)',
                  color: 'rgb(var(--brand-primary))',
                }}
              >
                {t('common.create')}
              </button>
            </div>
          </FormField>
          <div className="flex gap-3 pt-3">
            <ShineButton
              variant="ghost"
              className="flex-1"
              onClick={() => { setShowForm(false); resetForm(); }}
            >
              {t('common.cancel')}
            </ShineButton>
            <ShineButton variant="primary" className="flex-1" onClick={save}>
              {editing ? t('common.save') : t('common.create')}
            </ShineButton>
          </div>
        </div>
      </Modal>

      {/* Credential reveal modal */}
      <Modal
        open={!!newCredential}
        onClose={() => setNewCredential(null)}
        title={t('users.invite')}
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'rgb(var(--warn))' }}>
            {t('users.tempPassword')}
          </p>
          <div
            className="rounded-xl p-4 font-mono text-sm space-y-2"
            style={{
              background: 'rgb(var(--surface-raised))',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2">
              <Mail size={12} style={{ color: 'var(--text-muted)' }} />
              <span>{newCredential?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={12} style={{ color: 'var(--text-muted)' }} />
              <span className="select-all">{newCredential?.password}</span>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(
                `${newCredential?.email} · ${newCredential?.password}`
              );
              addToast('success', t('common.copied'));
            }}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgb(var(--brand-primary) / 0.1)',
              color: 'rgb(var(--brand-primary))',
            }}
          >
            {t('common.copy')}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const { t } = useLanguage();
  const map: Record<UserRole, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    super_admin: {
      label: 'Super',
      color: 'rgb(var(--brand-primary))',
      bg: 'rgb(var(--brand-primary) / 0.14)',
      icon: <ShieldCheck size={10} />,
    },
    admin: {
      label: t('users.admin'),
      color: 'rgb(var(--info))',
      bg: 'rgb(var(--info) / 0.14)',
      icon: <Shield size={10} />,
    },
    operador: {
      label: t('users.operator'),
      color: 'rgb(var(--success))',
      bg: 'rgb(var(--success) / 0.14)',
      icon: <User size={10} />,
    },
    solo_lectura: {
      label: t('users.readonly'),
      color: 'var(--text-secondary)',
      bg: 'rgb(127 127 140 / 0.14)',
      icon: <User size={10} />,
    },
  };
  const m = map[role];
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
      style={{ background: m.bg, color: m.color }}
    >
      {m.icon}
      {m.label}
    </span>
  );
}

function RolePill({
  role,
  active,
  onClick,
}: {
  role: UserRole;
  active: boolean;
  onClick: () => void;
}) {
  const { t } = useLanguage();
  const labels: Record<UserRole, string> = {
    super_admin: 'Super',
    admin: t('users.admin'),
    operador: t('users.operator'),
    solo_lectura: t('users.readonly'),
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-2 rounded-lg text-xs font-medium transition"
      style={{
        background: active
          ? 'rgb(var(--brand-primary) / 0.14)'
          : 'rgb(var(--surface-raised))',
        color: active ? 'rgb(var(--brand-primary))' : 'var(--text-secondary)',
        border: `1px solid ${active ? 'rgb(var(--brand-primary) / 0.3)' : 'var(--border-subtle)'}`,
      }}
    >
      {labels[role]}
    </button>
  );
}

function IconBtn({
  onClick,
  icon,
  tone = 'default',
  disabled,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      disabled={disabled}
      className="p-1.5 rounded-md transition disabled:opacity-30"
      style={{
        color: tone === 'danger' ? 'rgb(var(--danger))' : 'var(--text-secondary)',
      }}
    >
      {icon}
    </motion.button>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span
        className="text-[11px] uppercase tracking-[0.12em] font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="shimmer-bg animate-shimmer rounded-lg h-14"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}
