'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { METADATA_FIELDS, type FieldDef } from '@/lib/metadata-fields';
import { api, type TipoNegocio } from '@/lib/api';

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  tipoNegocio: TipoNegocio;
  onCreated: () => void;
}

function FieldInput({
  def,
  value,
  onChange,
}: {
  def: FieldDef;
  value: any;
  onChange: (v: any) => void;
}) {
  const common =
    'w-full bg-ink-900 hairline rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-500/40 transition';

  if (def.type === 'select') {
    return (
      <select className={common} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {def.options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (def.type === 'boolean') {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`${common} text-left flex items-center justify-between`}
      >
        <span className="text-ink-300">{value ? 'Sí' : 'No'}</span>
        <span className={`w-9 h-5 rounded-full transition ${value ? 'bg-accent-500' : 'bg-ink-700'}`}>
          <motion.span
            className="block w-4 h-4 bg-white rounded-full mt-0.5"
            animate={{ x: value ? 18 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </span>
      </button>
    );
  }
  return (
    <input
      type={def.type === 'date' ? 'date' : def.type === 'number' ? 'number' : 'text'}
      className={common}
      placeholder={def.placeholder}
      min={def.min}
      max={def.max}
      step={def.step}
      value={value ?? ''}
      onChange={(e) =>
        onChange(def.type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value)
      }
    />
  );
}

export function ProductForm({ tipoNegocio, onCreated }: Props) {
  const extraFields = useMemo(() => METADATA_FIELDS[tipoNegocio] || [], [tipoNegocio]);

  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState<number | ''>('');
  const [stock, setStock] = useState<number | ''>(0);
  const [unidad, setUnidad] = useState('unidad');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cleanMeta = Object.fromEntries(
        Object.entries(metadata).filter(([, v]) => v !== undefined && v !== '')
      );
      await api.createProduct({
        sku,
        nombre,
        precio: Number(precio),
        stock: Number(stock),
        unidad,
        metadata: cleanMeta,
      });
      setSku('');
      setNombre('');
      setPrecio('');
      setStock(0);
      setMetadata({});
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Error al crear producto');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass hairline rounded-2xl p-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Labeled label="SKU">
          <input
            required
            className="w-full bg-ink-900 hairline rounded-lg px-3 py-2 text-sm font-mono"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
        </Labeled>
        <Labeled label="Nombre" className="md:col-span-2">
          <input
            required
            className="w-full bg-ink-900 hairline rounded-lg px-3 py-2 text-sm"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </Labeled>
        <Labeled label="Precio">
          <input
            required
            type="number"
            step="0.01"
            className="w-full bg-ink-900 hairline rounded-lg px-3 py-2 text-sm"
            value={precio}
            onChange={(e) => setPrecio(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Labeled>
        <Labeled label="Stock inicial">
          <input
            type="number"
            className="w-full bg-ink-900 hairline rounded-lg px-3 py-2 text-sm"
            value={stock}
            onChange={(e) => setStock(e.target.value === '' ? 0 : Number(e.target.value))}
          />
        </Labeled>
        <Labeled label="Unidad">
          <input
            className="w-full bg-ink-900 hairline rounded-lg px-3 py-2 text-sm"
            value={unidad}
            onChange={(e) => setUnidad(e.target.value)}
          />
        </Labeled>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tipoNegocio}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="border-t border-white/5 pt-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1.5 w-1.5 rounded-full bg-accent-500" />
            <h4 className="text-sm font-medium text-ink-300">
              Campos específicos · <span className="text-ink-100 capitalize">{tipoNegocio}</span>
            </h4>
          </div>

          {extraFields.length === 0 ? (
            <p className="text-xs text-ink-500">Sin campos adicionales para este rubro.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {extraFields.map((def) => (
                <Labeled key={def.name} label={def.label + (def.required ? ' *' : '')}>
                  <FieldInput
                    def={def}
                    value={metadata[def.name]}
                    onChange={(v) => setMetadata((m) => ({ ...m, [def.name]: v }))}
                  />
                </Labeled>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-400 font-mono"
        >
          {error}
        </motion.p>
      )}

      <div className="flex justify-end">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          disabled={submitting}
          className="px-5 py-2 rounded-full bg-ink-100 text-ink-950 text-sm font-medium hairline-hover disabled:opacity-60 disabled:cursor-wait"
        >
          {submitting ? 'Creando…' : 'Crear producto'}
        </motion.button>
      </div>
    </form>
  );
}

function Labeled({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 ${className || ''}`}>
      <span className="text-[11px] uppercase tracking-wider text-ink-500">{label}</span>
      {children}
    </label>
  );
}
