'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette, Plus, Edit3, Trash2, Check, Wand2,
  Eye, Star, Layout, Type,
} from 'lucide-react';
import { api, type InvoiceTemplate, type TemplatePreset, type InvoiceTemplateTheme } from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { cn } from '@/lib/utils';
import { ShineButton } from '@/components/ui/ShineButton';
import { GlowCard } from '@/components/ui/GlowCard';
import { Modal } from '@/components/ui/Modal';
import { addToast } from '@/components/ui/Toaster';
import SplitText from '@/components/reactbits/SplitText';
import BlurText from '@/components/reactbits/BlurText';

const EASE = [0.23, 1, 0.32, 1] as const;

/* ── Invoice Preview Miniature ── */
function InvoicePreview({ theme }: { theme: InvoiceTemplateTheme }) {
  return (
    <div
      className="w-full aspect-[3/4] rounded-xl overflow-hidden border border-white/[0.04] relative bg-surface-card"
    >
      <div
        className="h-1/4 p-3 flex flex-col justify-between"
        style={{ background: `linear-gradient(135deg, ${theme.gradient_from}, ${theme.gradient_to})` }}
      >
        <div className="flex items-center justify-between">
          <div
            className="w-6 h-6 rounded bg-white/20"
            style={{
              marginLeft: theme.logo_position === 'right' ? 'auto' : theme.logo_position === 'center' ? 'auto' : '0',
              marginRight: theme.logo_position === 'center' ? 'auto' : '0',
            }}
          />
          <div className="text-[6px] font-bold text-white/80">FACTURA</div>
        </div>
        <div className="space-y-0.5">
          <div className="w-16 h-1 rounded-full bg-white/30" />
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>
      </div>

      <div className="p-3 space-y-1.5">
        {[0.7, 0.9, 0.5, 0.8].map((w, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-1 rounded-full" style={{ width: `${w * 60}%`, backgroundColor: `${theme.accent}30` }} />
            <div className="h-1 w-8 rounded-full bg-white/[0.06]" />
          </div>
        ))}
        <div className="border-t border-white/[0.04] mt-2 pt-2 flex justify-end">
          <div className="h-2 w-12 rounded" style={{ backgroundColor: `${theme.accent}40` }} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2">
        <div className="w-full h-0.5 rounded-full" style={{ backgroundColor: `${theme.accent}20` }} />
      </div>
    </div>
  );
}

export default function PlantillasPage() {
  const { tenant: active } = useSession();
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [presets, setPresets] = useState<TemplatePreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState<string | null>(null);

  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<InvoiceTemplate | null>(null);
  const [editorForm, setEditorForm] = useState<{
    nombre: string; slug: string; descripcion: string; is_default: boolean;
    theme: { accent: string; gradient_from: string; gradient_to: string; font: 'inter' | 'mono' | 'serif'; layout: 'modern' | 'compact' | 'minimal' | 'classic'; logo_position: 'left' | 'center' | 'right'; };
    defaults: { impuesto_pct: number; metodo_pago: string; moneda: string; notas: string; };
  }>({
    nombre: '', slug: '', descripcion: '', is_default: false,
    theme: {
      accent: '#7c5cff', gradient_from: '#7c5cff', gradient_to: '#06b6d4',
      font: 'inter', layout: 'modern', logo_position: 'left',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: '' },
  });

  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate | null>(null);

  const loadData = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const [tmplRes, presetRes] = await Promise.all([
        api.listTemplates(),
        api.listPresets(),
      ]);
      setTemplates(tmplRes.data);
      setPresets(presetRes.data);
    } catch { /* silencio */ }
    finally { setLoading(false); }
  }, [active]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApplyPreset = async (presetSlug: string) => {
    if (!active) return;
    setApplyingPreset(presetSlug);
    try {
      await api.applyPreset(presetSlug);
      addToast('success', 'Preset aplicado correctamente');
      loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Error al aplicar preset');
    } finally {
      setApplyingPreset(null);
    }
  };

  const openNewEditor = () => {
    setEditing(null);
    setEditorForm({
      nombre: '', slug: '', descripcion: '', is_default: false,
      theme: { accent: '#7c5cff', gradient_from: '#7c5cff', gradient_to: '#06b6d4', font: 'inter', layout: 'modern', logo_position: 'left' },
      defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: '' },
    });
    setShowEditor(true);
  };

  const openEditEditor = (template: InvoiceTemplate) => {
    setEditing(template);
    setEditorForm({
      nombre: template.nombre,
      slug: template.slug,
      descripcion: template.descripcion || '',
      is_default: template.is_default,
      theme: {
        accent: template.theme.accent || '#7c5cff',
        gradient_from: template.theme.gradient_from || '#7c5cff',
        gradient_to: template.theme.gradient_to || '#06b6d4',
        font: (template.theme.font as any) || 'inter',
        layout: (template.theme.layout as any) || 'modern',
        logo_position: (template.theme.logo_position as any) || 'left',
      },
      defaults: {
        impuesto_pct: template.defaults?.impuesto_pct ?? 0,
        metodo_pago: template.defaults?.metodo_pago ?? 'efectivo',
        moneda: template.defaults?.moneda ?? 'USD',
        notas: template.defaults?.notas ?? '',
      },
    });
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!active || !editorForm.nombre.trim() || !editorForm.slug.trim()) {
      addToast('error', 'Nombre y slug son obligatorios');
      return;
    }
    try {
      const payload = {
        nombre: editorForm.nombre,
        slug: editorForm.slug,
        descripcion: editorForm.descripcion || null,
        is_default: editorForm.is_default,
        theme: editorForm.theme,
        defaults: editorForm.defaults,
      };
      if (editing) {
        await api.updateTemplate(editing.id, payload);
        addToast('success', `Plantilla "${editorForm.nombre}" actualizada`);
      } else {
        await api.createTemplate(payload);
        addToast('success', `Plantilla "${editorForm.nombre}" creada`);
      }
      setShowEditor(false);
      loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Error al guardar plantilla');
    }
  };

  const handleDelete = async (template: InvoiceTemplate) => {
    if (!active) return;
    if (!confirm(`¿Eliminar la plantilla "${template.nombre}"?`)) return;
    try {
      await api.deleteTemplate(template.id);
      addToast('success', `Plantilla "${template.nombre}" eliminada`);
      loadData();
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
    <div className="px-6 py-8 max-w-6xl mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="flex items-end justify-between mb-8"
      >
        <div>
          <span className="text-[11px] uppercase tracking-[0.2em] text-ink-500 font-medium">
            Personalización
          </span>
          <SplitText
            text="Plantillas de Factura"
            tag="h1"
            className="text-3xl font-bold tracking-tight mt-1"
            delay={0.025}
          />
          <p className="text-sm text-ink-500 mt-2">
            Personaliza el diseño visual de tus facturas con presets o crea las tuyas
          </p>
        </div>
        <ShineButton onClick={openNewEditor} icon={<Plus size={14} />}>
          Nueva plantilla
        </ShineButton>
      </motion.div>

      {/* ═══ Presets ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
        className="mb-10"
      >
        <h2 className="text-[11px] uppercase tracking-[0.15em] text-ink-500 font-medium mb-4 flex items-center gap-2">
          <Wand2 size={12} /> Presets vibrantes
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {presets.map((preset) => {
            const isApplied = templates.some((t) => t.slug === preset.slug);
            const isApplying = applyingPreset === preset.slug;
            return (
              <motion.div
                key={preset.slug}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.98 }}
                className="relative group"
              >
                <div className="rounded-2xl overflow-hidden border border-white/[0.04] hover:border-white/[0.1] transition-all duration-200 bg-surface-card">
                  <InvoicePreview theme={preset.theme} />
                  <div className="p-3">
                    <h3 className="font-medium text-sm tracking-tight">{preset.nombre}</h3>
                    <p className="text-[10px] text-ink-600 mt-0.5 line-clamp-1">{preset.descripcion}</p>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleApplyPreset(preset.slug)}
                      disabled={isApplying}
                      className={cn(
                        'w-full mt-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
                        isApplied
                          ? 'bg-neon-green/10 text-neon-green'
                          : 'bg-accent-500/10 text-accent-light hover:bg-accent-500/18'
                      )}
                    >
                      {isApplying ? 'Aplicando...' : isApplied ? '✓ Aplicado' : 'Aplicar'}
                    </motion.button>
                  </div>
                </div>
                <div className="flex gap-1 justify-center mt-2">
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: preset.theme.accent }} />
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: preset.theme.gradient_from }} />
                  <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: preset.theme.gradient_to }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* ═══ Mis Plantillas ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: EASE }}
      >
        <h2 className="text-[11px] uppercase tracking-[0.15em] text-ink-500 font-medium mb-4 flex items-center gap-2">
          <Palette size={12} /> Mis plantillas
        </h2>

        {loading ? (
          <TemplateSkeleton />
        ) : templates.length === 0 ? (
          <div className="text-center py-16 bg-surface-card border border-white/[0.04] rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
              <Palette size={24} className="text-ink-600 opacity-40" />
            </div>
            <p className="text-ink-400 font-medium">Aún no tienes plantillas propias</p>
            <p className="text-xs text-ink-600 mt-1">Aplica un preset o crea una personalizada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {templates.map((template, i) => (
                <motion.div
                  key={template.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.04, duration: 0.3, ease: EASE }}
                >
                  <GlowCard glowColor="rgba(139, 92, 246, 0.12)">
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-20 flex-shrink-0">
                          <InvoicePreview theme={template.theme} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium tracking-tight text-sm truncate">
                              {template.nombre}
                            </h3>
                            {template.is_default && (
                              <Star size={12} className="text-neon-yellow flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-ink-600 mt-0.5 line-clamp-2">
                            {template.descripcion || 'Sin descripción'}
                          </p>
                          <div className="flex gap-1 mt-2">
                            <span className="badge badge-ghost">
                              <Layout size={8} /> {template.theme.layout || 'modern'}
                            </span>
                            <span className="badge badge-ghost">
                              <Type size={8} /> {template.theme.font || 'inter'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 border-t border-white/[0.04] pt-3">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setPreviewTemplate(template)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs bg-white/[0.04] text-ink-400 hover:bg-white/[0.08] hover:text-ink-200 transition-colors duration-150"
                        >
                          <Eye size={12} /> Preview
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => openEditEditor(template)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs bg-accent-500/8 text-accent-light hover:bg-accent-500/15 transition-colors duration-150"
                        >
                          <Edit3 size={12} /> Editar
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(template)}
                          className="p-1.5 rounded-lg text-ink-600 hover:text-neon-red hover:bg-neon-red/8 transition-colors duration-150"
                        >
                          <Trash2 size={12} />
                        </motion.button>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.section>

      {/* ═══ Editor Modal ═══ */}
      <Modal open={showEditor} onClose={() => setShowEditor(false)} title={editing ? 'Editar plantilla' : 'Nueva plantilla'} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField label="Nombre *">
              <input type="text" value={editorForm.nombre} onChange={(e) => setEditorForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Mi Plantilla Profesional" className="w-full" />
            </FormField>
            <FormField label="Slug *">
              <input type="text" value={editorForm.slug} onChange={(e) => setEditorForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))} placeholder="mi-plantilla" className="w-full font-mono text-sm" />
            </FormField>
            <FormField label="Descripción">
              <textarea value={editorForm.descripcion} onChange={(e) => setEditorForm((f) => ({ ...f, descripcion: e.target.value }))} placeholder="Descripción breve..." rows={2} className="w-full resize-none" />
            </FormField>

            <FormField label="Colores del tema">
              <div className="grid grid-cols-3 gap-3">
                <ColorPicker label="Acento" value={editorForm.theme.accent} onChange={(v) => setEditorForm((f) => ({ ...f, theme: { ...f.theme, accent: v } }))} />
                <ColorPicker label="Grad. inicio" value={editorForm.theme.gradient_from} onChange={(v) => setEditorForm((f) => ({ ...f, theme: { ...f.theme, gradient_from: v } }))} />
                <ColorPicker label="Grad. fin" value={editorForm.theme.gradient_to} onChange={(v) => setEditorForm((f) => ({ ...f, theme: { ...f.theme, gradient_to: v } }))} />
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Diseño">
                <select value={editorForm.theme.layout} onChange={(e) => setEditorForm((f) => ({ ...f, theme: { ...f.theme, layout: e.target.value as any } }))} className="w-full">
                  <option value="modern">Moderno</option>
                  <option value="compact">Compacto</option>
                  <option value="minimal">Minimal</option>
                  <option value="classic">Clásico</option>
                </select>
              </FormField>
              <FormField label="Tipografía">
                <select value={editorForm.theme.font} onChange={(e) => setEditorForm((f) => ({ ...f, theme: { ...f.theme, font: e.target.value as any } }))} className="w-full">
                  <option value="inter">Inter (Sans)</option>
                  <option value="mono">Monoespaciada</option>
                  <option value="serif">Serif</option>
                </select>
              </FormField>
            </div>

            <FormField label="Posición del logo">
              <div className="flex gap-2">
                {(['left', 'center', 'right'] as const).map((pos) => (
                  <motion.button
                    key={pos}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setEditorForm((f) => ({ ...f, theme: { ...f.theme, logo_position: pos } }))}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-200',
                      editorForm.theme.logo_position === pos
                        ? 'bg-accent-500/12 text-accent-light border border-accent-500/25'
                        : 'bg-white/[0.03] text-ink-500 border border-white/[0.04]'
                    )}
                  >
                    {pos === 'left' ? 'Izquierda' : pos === 'center' ? 'Centro' : 'Derecha'}
                  </motion.button>
                ))}
              </div>
            </FormField>

            <div className="border-t border-white/[0.04] pt-4 space-y-3">
              <span className="text-[11px] text-ink-500 uppercase tracking-[0.12em] font-medium block">Valores por defecto</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-ink-600 mb-1 block">Impuesto (%)</label>
                  <input type="number" min={0} max={100} value={editorForm.defaults.impuesto_pct} onChange={(e) => setEditorForm((f) => ({ ...f, defaults: { ...f.defaults, impuesto_pct: Number(e.target.value) } }))} className="w-full" />
                </div>
                <div>
                  <label className="text-[10px] text-ink-600 mb-1 block">Método pago</label>
                  <select value={editorForm.defaults.metodo_pago} onChange={(e) => setEditorForm((f) => ({ ...f, defaults: { ...f.defaults, metodo_pago: e.target.value } }))} className="w-full">
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[11px] text-ink-500 uppercase tracking-[0.12em] font-medium block">Preview en tiempo real</span>
            <div className="max-w-[240px] mx-auto">
              <InvoicePreview theme={editorForm.theme} />
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <div className="w-10 h-10 rounded-xl shadow-lg border border-white/[0.04]" style={{ backgroundColor: editorForm.theme.accent }} />
              <div className="w-10 h-10 rounded-xl shadow-lg border border-white/[0.04]" style={{ background: `linear-gradient(135deg, ${editorForm.theme.gradient_from}, ${editorForm.theme.gradient_to})` }} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-4 border-t border-white/[0.04]">
          <ShineButton variant="ghost" className="flex-1" onClick={() => setShowEditor(false)}>Cancelar</ShineButton>
          <ShineButton variant="primary" className="flex-1" onClick={handleSave} icon={<Check size={14} />}>
            {editing ? 'Guardar cambios' : 'Crear plantilla'}
          </ShineButton>
        </div>
      </Modal>

      {/* ═══ Preview Modal ═══ */}
      <Modal open={!!previewTemplate} onClose={() => setPreviewTemplate(null)} title={`Preview: ${previewTemplate?.nombre || ''}`} size="md">
        {previewTemplate && (
          <div className="space-y-4">
            <div className="max-w-[280px] mx-auto">
              <InvoicePreview theme={previewTemplate.theme} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoChip label="Layout" value={previewTemplate.theme.layout || 'modern'} />
              <InfoChip label="Font" value={previewTemplate.theme.font || 'inter'} />
              <InfoChip label="Impuesto" value={`${previewTemplate.defaults?.impuesto_pct ?? 0}%`} />
              <InfoChip label="Moneda" value={previewTemplate.defaults?.moneda ?? 'USD'} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ── Helpers ── */
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] uppercase tracking-[0.12em] text-ink-500 font-medium">{label}</span>
      {children}
    </label>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-card border border-white/[0.04] rounded-xl p-3">
      <span className="text-[10px] text-ink-600 uppercase tracking-wider block mb-1">{label}</span>
      <span className="font-medium capitalize text-sm">{value}</span>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[10px] text-ink-600 mb-1 block">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent p-0" />
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full !py-1.5 font-mono text-xs" />
      </div>
    </div>
  );
}

function TemplateSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="shimmer-bg animate-shimmer rounded-2xl h-48" style={{ opacity: 1 - i * 0.15 }} />
      ))}
    </div>
  );
}
