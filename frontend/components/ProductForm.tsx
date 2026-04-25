'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { METADATA_FIELDS, type FieldDef } from '@/lib/metadata-fields';
import { api, type TipoNegocio } from '@/lib/api';
import { addToast } from '@/components/ui/Toaster';

const EASE = [0.22, 1, 0.36, 1] as const;

interface Props {
  readonly tipoNegocio: TipoNegocio;
  readonly onCreated: () => void;
}

const INPUT_CLASS =
  'w-full rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 transition';

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgb(var(--surface-raised))',
  border: '1px solid var(--border-subtle)',
  color: 'var(--text-primary)',
};

function FieldInput({
  def,
  value,
  onChange,
}: {
  readonly def: FieldDef;
  readonly value: unknown;
  readonly onChange: (v: unknown) => void;
}) {
  if (def.type === 'select') {
    return (
      <select
        className={INPUT_CLASS}
        style={INPUT_STYLE}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
      >
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
    const active = Boolean(value);
    return (
      <button
        type="button"
        onClick={() => onChange(!active)}
        className={`${INPUT_CLASS} text-left flex items-center justify-between`}
        style={INPUT_STYLE}
      >
        <span style={{ color: 'var(--text-secondary)' }}>{active ? 'Sí' : 'No'}</span>
        <span
          className="w-9 h-5 rounded-full transition inline-block"
          style={{
            background: active
              ? 'rgb(var(--brand-primary))'
              : 'rgb(var(--surface-base))',
          }}
        >
          <motion.span
            className="block w-4 h-4 bg-white rounded-full mt-0.5"
            animate={{ x: active ? 18 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </span>
      </button>
    );
  }
  let inputType: string;
  if (def.type === 'date') inputType = 'date';
  else if (def.type === 'number') inputType = 'number';
  else inputType = 'text';
  let displayValue = '';
  if (typeof value === 'string') displayValue = value;
  else if (typeof value === 'number') displayValue = String(value);
  return (
    <input
      type={inputType}
      className={INPUT_CLASS}
      style={INPUT_STYLE}
      placeholder={def.placeholder}
      min={def.min}
      max={def.max}
      step={def.step}
      value={displayValue}
      onChange={(e) => {
        if (def.type === 'number') {
          onChange(e.target.value === '' ? undefined : Number(e.target.value));
        } else {
          onChange(e.target.value);
        }
      }}
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
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cleanMeta = Object.fromEntries(
        Object.entries(metadata).filter(([, v]) => v !== undefined && v !== ''),
      );
      await api.createProduct({
        sku,
        nombre,
        precio: Number(precio),
        stock: Number(stock),
        unidad,
        metadata: cleanMeta,
      });
      addToast('success', `${sku} creado`);
      setSku('');
      setNombre('');
      setPrecio('');
      setStock(0);
      setMetadata({});
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear producto';
      setError(msg);
      addToast('error', msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl p-6 space-y-5"
      style={{
        background: 'rgb(var(--surface-card))',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Labeled label="SKU">
          <input
            required
            className={`${INPUT_CLASS} font-mono`}
            style={INPUT_STYLE}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
        </Labeled>
        <Labeled label="Nombre" className="md:col-span-2">
          <input
            required
            className={INPUT_CLASS}
            style={INPUT_STYLE}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
        </Labeled>
        <Labeled label="Precio">
          <input
            required
            type="number"
            step="0.01"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
            value={precio}
            onChange={(e) => setPrecio(e.target.value === '' ? '' : Number(e.target.value))}
          />
        </Labeled>
        <Labeled label="Stock inicial">
          <input
            type="number"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
            value={stock}
            onChange={(e) => setStock(e.target.value === '' ? 0 : Number(e.target.value))}
          />
        </Labeled>
        <Labeled label="Unidad">
          <input
            className={INPUT_CLASS}
            style={INPUT_STYLE}
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
          className="pt-5"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <div
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: 'rgb(var(--brand-primary))' }}
            />
            <h4 className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Campos específicos ·{' '}
              <span className="capitalize" style={{ color: 'var(--text-primary)' }}>
                {tipoNegocio}
              </span>
            </h4>
          </div>

          {extraFields.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Sin campos adicionales para este rubro.
            </p>
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
          className="text-sm font-mono"
          style={{ color: 'rgb(var(--danger))' }}
        >
          {error}
        </motion.p>
      )}

      <div className="flex justify-end">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          disabled={submitting}
          className="px-5 py-2 rounded-full text-sm font-medium disabled:opacity-60 disabled:cursor-wait"
          style={{
            background: 'rgb(var(--brand-primary))',
            color: 'white',
          }}
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
  readonly label: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <label className={`block space-y-1 ${className || ''}`}>
      <span
        className="text-[11px] uppercase tracking-wider"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
