'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Receipt,
} from 'lucide-react';
import { api, type Customer, type Invoice } from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { useLanguage } from '@/lib/language-context';
import { ShineButton } from '@/components/ui/ShineButton';
import { Modal } from '@/components/ui/Modal';
import { addToast } from '@/components/ui/Toaster';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import SplitText from '@/components/reactbits/SplitText';
import { formatCurrency } from '@/lib/utils';

const EASE = [0.23, 1, 0.32, 1] as const;

export default function ClientesPage() {
  const { tenant: active } = useSession();
  const { t, lang } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [viewing, setViewing] = useState<Customer | null>(null);

  const [form, setForm] = useState({
    nombre: '',
    documento: '',
    email: '',
    telefono: '',
    direccion: '',
  });

  const resetForm = () => {
    setForm({ nombre: '', documento: '', email: '', telefono: '', direccion: '' });
    setEditing(null);
  };

  const tenantId = active?.id;
  const loadCustomers = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.listCustomers(search || undefined);
      setCustomers(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error cargando clientes';
      setError(msg);
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [tenantId, search]);

  useEffect(() => {
    const timer = setTimeout(loadCustomers, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [loadCustomers, search]);

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      nombre: customer.nombre,
      documento: customer.documento || '',
      email: customer.email || '',
      telefono: customer.telefono || '',
      direccion: customer.direccion || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!active || !form.nombre.trim()) {
      addToast('error', t('common.name'));
      return;
    }
    try {
      if (editing) {
        await api.updateCustomer(editing.id, form);
        addToast('success', form.nombre);
      } else {
        await api.createCustomer(form);
        addToast('success', form.nombre);
      }
      resetForm();
      setShowForm(false);
      loadCustomers();
    } catch (err: any) {
      addToast('error', err.message || 'Error');
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!active) return;
    if (!confirm(`${t('common.delete')} ${customer.nombre}?`)) return;
    try {
      await api.deleteCustomer(customer.id);
      addToast('success', customer.nombre);
      loadCustomers();
    } catch (err: any) {
      addToast('error', err.message || 'Error');
    }
  };

  if (!active) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p style={{ color: 'var(--text-muted)' }}>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
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
            {t('customers.title')}
          </span>
          <SplitText
            text={t('customers.title')}
            tag="h1"
            className="text-3xl font-bold tracking-tight mt-1"
            delay={0.03}
          />
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {customers.length}
          </p>
        </div>
        <ShineButton onClick={() => { resetForm(); setShowForm(true); }} icon={<Plus size={14} />}>
          {t('customers.addCustomer')}
        </ShineButton>
      </motion.div>

      <ErrorBanner
        error={error}
        onRetry={loadCustomers}
        onDismiss={() => setError(null)}
      />

      {/* Search */}
      <div className="relative mb-6">
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

      {/* Card grid */}
      <AnimatePresence mode="popLayout">
        {loading ? (
          <Skeleton key="skeleton" />
        ) : customers.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
            style={{ color: 'var(--text-muted)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgb(var(--surface-raised))' }}
            >
              <User size={24} className="opacity-40" />
            </div>
            <p className="font-medium">{t('customers.empty')}</p>
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {customers.map((customer, i) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                index={i}
                onEdit={() => openEdit(customer)}
                onDelete={() => handleDelete(customer)}
                onView={() => setViewing(customer)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <CustomerInvoicesModal
        customer={viewing}
        onClose={() => setViewing(null)}
      />

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title={editing ? t('common.edit') : t('customers.addCustomer')}
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
          <FormField label={t('common.document')}>
            <input
              type="text"
              value={form.documento}
              onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
              className="w-full"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('common.email')}>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full"
              />
            </FormField>
            <FormField label={t('common.phone')}>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className="w-full"
              />
            </FormField>
          </div>
          <FormField label={t('common.address')}>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
              className="w-full"
            />
          </FormField>
          <div className="flex gap-3 pt-3">
            <ShineButton variant="ghost" className="flex-1" onClick={() => { setShowForm(false); resetForm(); }}>
              {t('common.cancel')}
            </ShineButton>
            <ShineButton variant="primary" className="flex-1" onClick={handleSave}>
              {editing ? t('common.save') : t('common.create')}
            </ShineButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CustomerCard({
  customer,
  index,
  onEdit,
  onDelete,
  onView,
}: {
  customer: Customer;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const { t } = useLanguage();
  const initial = useMemo(() => (customer.nombre || '?').charAt(0).toUpperCase(), [customer.nombre]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: Math.min(index * 0.03, 0.2), duration: 0.35, ease: EASE }}
      whileHover={{ y: -2 }}
      className="rounded-2xl p-5 transition group"
      style={{
        background: 'rgb(var(--surface-card))',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm shrink-0"
          style={{
            background:
              'linear-gradient(135deg, rgb(var(--brand-primary) / 0.18), rgb(var(--brand-secondary) / 0.18))',
            color: 'rgb(var(--brand-primary))',
          }}
        >
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium tracking-tight truncate">{customer.nombre}</div>
          {customer.documento && (
            <div className="text-[11px] mt-0.5 inline-flex items-center gap-1 font-mono" style={{ color: 'var(--text-muted)' }}>
              <FileText size={10} />
              {customer.documento}
            </div>
          )}
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {customer.email && (
          <li className="flex items-center gap-2 truncate">
            <Mail size={11} style={{ color: 'var(--text-muted)' }} /> {customer.email}
          </li>
        )}
        {customer.telefono && (
          <li className="flex items-center gap-2">
            <Phone size={11} style={{ color: 'var(--text-muted)' }} /> {customer.telefono}
          </li>
        )}
        {customer.direccion && (
          <li className="flex items-center gap-2 truncate">
            <MapPin size={11} style={{ color: 'var(--text-muted)' }} /> {customer.direccion}
          </li>
        )}
      </ul>

      <div className="mt-4 flex items-center justify-between gap-1 opacity-70 group-hover:opacity-100 transition">
        <button
          onClick={onView}
          className="text-xs inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition"
          style={{
            color: 'rgb(var(--brand-primary))',
            background: 'rgb(var(--brand-primary) / 0.08)',
          }}
        >
          <Receipt size={11} /> {t('customers.viewInvoices')}
        </button>
        <div className="flex items-center gap-1">
          <IconBtn onClick={onEdit} icon={<Edit3 size={12} />} title={t('common.edit')} />
          <IconBtn onClick={onDelete} icon={<Trash2 size={12} />} title={t('common.delete')} tone="danger" />
        </div>
      </div>
    </motion.div>
  );
}

function IconBtn({
  onClick,
  icon,
  title,
  tone = 'default',
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  tone?: 'default' | 'danger';
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-md transition"
      style={{
        color: tone === 'danger' ? 'rgb(var(--danger))' : 'var(--text-secondary)',
      }}
    >
      {icon}
    </motion.button>
  );
}

function CustomerInvoicesModal({
  customer,
  onClose,
}: {
  customer: Customer | null;
  onClose: () => void;
}) {
  const { t, lang } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setLoading(true);
    api
      .listInvoices({ search: customer.nombre, limit: 50 })
      .then((r) => setInvoices(r.data.filter((i) => i.customer_id === customer.id)))
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }, [customer]);

  const total = useMemo(
    () =>
      invoices
        .filter((i) => i.estado !== 'anulada')
        .reduce((sum, i) => sum + Number(i.total), 0),
    [invoices]
  );

  return (
    <Modal open={!!customer} onClose={onClose} title={customer?.nombre || ''} size="lg">
      {loading ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
          {t('common.loading')}
        </p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
          {t('invoicing.empty')}
        </p>
      ) : (
        <>
          <div
            className="rounded-xl px-4 py-3 mb-4 flex justify-between items-center"
            style={{ background: 'rgb(var(--brand-primary) / 0.1)' }}
          >
            <span className="text-xs uppercase tracking-wider" style={{ color: 'rgb(var(--brand-primary))' }}>
              {t('common.total')}
            </span>
            <span className="text-xl font-bold font-mono" style={{ color: 'rgb(var(--brand-primary))' }}>
              {formatCurrency(total)}
            </span>
          </div>
          <ul className="space-y-2">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                style={{
                  background: 'rgb(var(--surface-raised))',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div className="font-mono text-xs">{inv.numero}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {new Date(inv.emitida_en).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold">{formatCurrency(Number(inv.total))}</div>
                  <div className="text-[10px] capitalize" style={{ color: 'var(--text-muted)' }}>
                    {inv.estado}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
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

function Skeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="shimmer-bg animate-shimmer rounded-2xl h-44"
          style={{ opacity: 1 - i * 0.1 }}
        />
      ))}
    </div>
  );
}
