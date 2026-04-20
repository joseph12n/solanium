'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Edit3, Trash2, User, Mail, Phone,
  MapPin, FileText,
} from 'lucide-react';
import { api, type Customer } from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { ShineButton } from '@/components/ui/ShineButton';
import { GlowCard } from '@/components/ui/GlowCard';
import { Modal } from '@/components/ui/Modal';
import { addToast } from '@/components/ui/Toaster';
import SplitText from '@/components/reactbits/SplitText';
import BlurText from '@/components/reactbits/BlurText';

const EASE = [0.23, 1, 0.32, 1] as const;

export default function ClientesPage() {
  const { tenant: active } = useSession();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const [form, setForm] = useState({
    nombre: '', documento: '', email: '', telefono: '', direccion: '',
  });

  const resetForm = () => {
    setForm({ nombre: '', documento: '', email: '', telefono: '', direccion: '' });
    setEditing(null);
  };

  const loadCustomers = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const { data } = await api.listCustomers(search || undefined);
      setCustomers(data);
    } catch { /* silencio */ }
    finally { setLoading(false); }
  }, [active, search]);

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
      addToast('error', 'El nombre es obligatorio');
      return;
    }
    try {
      if (editing) {
        await api.updateCustomer(editing.id, form);
        addToast('success', `Cliente "${form.nombre}" actualizado`);
      } else {
        await api.createCustomer(form);
        addToast('success', `Cliente "${form.nombre}" creado`);
      }
      resetForm();
      setShowForm(false);
      loadCustomers();
    } catch (err: any) {
      addToast('error', err.message || 'Error al guardar cliente');
    }
  };

  const handleDelete = async (customer: Customer) => {
    if (!active) return;
    if (!confirm(`¿Eliminar al cliente "${customer.nombre}"?`)) return;
    try {
      await api.deleteCustomer(customer.id);
      addToast('success', `Cliente "${customer.nombre}" eliminado`);
      loadCustomers();
    } catch (err: any) {
      addToast('error', err.message || 'Error al eliminar');
    }
  };

  if (!active) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-ink-500">Selecciona un tenant para comenzar</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="flex items-end justify-between mb-8"
      >
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-ink-500 font-medium">
            Gestión
          </span>
          <SplitText
            text="Clientes"
            tag="h1"
            className="text-3xl font-bold tracking-tight mt-1"
            delay={0.03}
          />
          <p className="text-sm text-ink-500 mt-2">
            {customers.length} clientes registrados
          </p>
        </div>
        <ShineButton
          onClick={() => { resetForm(); setShowForm(true); }}
          icon={<Plus size={14} />}
        >
          Nuevo cliente
        </ShineButton>
      </motion.div>

      {/* ── Search ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: EASE }}
        className="relative mb-6"
      >
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          type="text"
          placeholder="Buscar por nombre, documento o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11"
        />
      </motion.div>

      {/* ── Lista ── */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <CustomersSkeleton key="skeleton" />
          ) : customers.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 text-ink-500"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                <User size={24} className="opacity-40" />
              </div>
              <p className="font-medium">No se encontraron clientes</p>
              <p className="text-xs mt-1 text-ink-600">Crea el primero con el botón de arriba</p>
            </motion.div>
          ) : (
            customers.map((customer, i) => (
              <motion.div
                key={customer.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: i * 0.04, duration: 0.35, ease: EASE }}
              >
                <GlowCard glowColor="rgba(52, 211, 153, 0.12)">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-neon-green/8 flex items-center justify-center flex-shrink-0">
                      <User size={18} className="text-neon-green" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium tracking-tight">{customer.nombre}</h3>
                        {customer.documento && (
                          <span className="badge badge-ghost">
                            <FileText size={10} />
                            {customer.documento}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-ink-500">
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail size={10} /> {customer.email}
                          </span>
                        )}
                        {customer.telefono && (
                          <span className="flex items-center gap-1">
                            <Phone size={10} /> {customer.telefono}
                          </span>
                        )}
                        {customer.direccion && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} /> {customer.direccion}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openEdit(customer)}
                        className="p-2 rounded-lg text-ink-500 hover:text-accent-light hover:bg-accent-500/8 transition-colors duration-150"
                      >
                        <Edit3 size={14} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(customer)}
                        className="p-2 rounded-lg text-ink-500 hover:text-neon-red hover:bg-neon-red/8 transition-colors duration-150"
                      >
                        <Trash2 size={14} />
                      </motion.button>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* ── Modal ── */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title={editing ? 'Editar cliente' : 'Nuevo cliente'}
      >
        <div className="space-y-4">
          <FormField label="Nombre *">
            <input
              type="text"
              placeholder="Nombre completo o razón social"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full"
              autoFocus
            />
          </FormField>

          <FormField label="Documento / NIT">
            <input
              type="text"
              placeholder="CC, NIT, RFC..."
              value={form.documento}
              onChange={(e) => setForm((f) => ({ ...f, documento: e.target.value }))}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Email">
              <input
                type="email"
                placeholder="email@ejemplo.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full"
              />
            </FormField>
            <FormField label="Teléfono">
              <input
                type="tel"
                placeholder="+57 300 000 0000"
                value={form.telefono}
                onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Dirección">
            <input
              type="text"
              placeholder="Dirección física"
              value={form.direccion}
              onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
              className="w-full"
            />
          </FormField>

          <div className="flex gap-3 pt-3">
            <ShineButton variant="ghost" className="flex-1" onClick={() => { setShowForm(false); resetForm(); }}>
              Cancelar
            </ShineButton>
            <ShineButton variant="primary" className="flex-1" onClick={handleSave}>
              {editing ? 'Guardar cambios' : 'Crear cliente'}
            </ShineButton>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] uppercase tracking-[0.12em] text-ink-500 font-medium">{label}</span>
      {children}
    </label>
  );
}

function CustomersSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="shimmer-bg animate-shimmer rounded-2xl h-20"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  );
}
