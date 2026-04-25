'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Plus,
  Edit3,
  Trash2,
  Check,
  Wand2,
  Eye,
  Star,
  Layout,
  Type,
  Sparkles,
  LayoutGrid,
  Receipt,
  Filter,
} from 'lucide-react';
import {
  api,
  type InvoiceTemplate,
  type TemplatePreset,
  type InvoiceTemplateTheme,
  type PresetStyle,
  type TipoNegocio,
} from '@/lib/api';
import { useSession } from '@/lib/session-context';
import { useLanguage } from '@/lib/language-context';
import { cn } from '@/lib/utils';
import { ShineButton } from '@/components/ui/ShineButton';
import { GlowCard } from '@/components/ui/GlowCard';
import { Modal } from '@/components/ui/Modal';
import { addToast } from '@/components/ui/Toaster';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import SplitText from '@/components/reactbits/SplitText';

const EASE = [0.23, 1, 0.32, 1] as const;

type PreviewMode = 'invoice' | 'ui';

/* ═══════════════════════════════════════════════════════════════════
 *  InvoicePreview — miniatura de factura
 * ═══════════════════════════════════════════════════════════════════ */
function InvoicePreview({ theme }: { theme: InvoiceTemplateTheme }) {
  return (
    <div
      className="w-full aspect-[3/4] rounded-xl overflow-hidden relative"
      style={{
        background: 'rgb(var(--surface-card))',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="h-1/4 p-3 flex flex-col justify-between"
        style={{ background: `linear-gradient(135deg, ${theme.gradient_from}, ${theme.gradient_to})` }}
      >
        <div className="flex items-center justify-between">
          <div
            className="w-6 h-6 rounded bg-white/20"
            style={{
              marginLeft:
                theme.logo_position === 'right'
                  ? 'auto'
                  : theme.logo_position === 'center'
                  ? 'auto'
                  : '0',
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
            <div
              className="h-1 rounded-full"
              style={{ width: `${w * 60}%`, backgroundColor: `${theme.accent}40` }}
            />
            <div className="h-1 w-8 rounded-full" style={{ background: 'rgba(127,127,140,0.15)' }} />
          </div>
        ))}
        <div
          className="mt-2 pt-2 flex justify-end"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <div className="h-2 w-12 rounded" style={{ backgroundColor: `${theme.accent}55` }} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-2">
        <div className="w-full h-0.5 rounded-full" style={{ backgroundColor: `${theme.accent}30` }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *  UIPreview — miniatura del skin del SaaS (sidebar + cards + buttons)
 * ═══════════════════════════════════════════════════════════════════ */
function UIPreview({ theme }: { theme: InvoiceTemplateTheme }) {
  const radiusButton =
    theme.button_style === 'pill' ? 999 : theme.button_style === 'sharp' ? 4 : 10;
  const sidebarBg =
    theme.sidebar_style === 'solid'
      ? 'rgba(20,21,30,0.95)'
      : theme.sidebar_style === 'minimal'
      ? 'transparent'
      : 'rgba(255,255,255,0.04)';
  const cardBorder =
    theme.card_style === 'bordered'
      ? `2px solid ${theme.accent}50`
      : theme.card_style === 'flat'
      ? '1px solid var(--border-subtle)'
      : '1px solid var(--border-default)';
  const fontFamily =
    theme.font === 'mono'
      ? 'var(--font-mono)'
      : theme.font === 'serif'
      ? 'var(--font-serif)'
      : 'var(--font-sans)';

  return (
    <div
      className="w-full aspect-[3/4] rounded-xl overflow-hidden relative flex"
      style={{
        background: 'rgb(var(--surface-base))',
        border: '1px solid var(--border-subtle)',
        fontFamily,
      }}
    >
      {/* Sidebar mini */}
      <div
        className="w-1/4 flex flex-col p-1.5 gap-1"
        style={{ background: sidebarBg, borderRight: '1px solid var(--border-subtle)' }}
      >
        <div
          className="w-4 h-4 rounded-md mb-1"
          style={{
            background: `linear-gradient(135deg, ${theme.gradient_from}, ${theme.gradient_to})`,
          }}
        />
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1.5 rounded"
            style={{
              background: i === 0 ? `${theme.accent}40` : 'rgba(127,127,140,0.18)',
              width: i === 0 ? '85%' : `${50 + i * 10}%`,
            }}
          />
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 p-2 space-y-2">
        {/* Hero card */}
        <div
          className="p-2 rounded-lg"
          style={{
            border: cardBorder,
            background: `linear-gradient(135deg, ${theme.accent}18, ${theme.gradient_to}10)`,
          }}
        >
          <div className="h-1.5 w-3/4 rounded" style={{ background: theme.accent }} />
          <div className="h-1 w-1/2 rounded mt-1" style={{ background: 'rgba(127,127,140,0.3)' }} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-1">
          {[theme.accent, theme.gradient_from, theme.gradient_to].map((c, i) => (
            <div
              key={i}
              className="p-1 rounded"
              style={{ border: cardBorder, background: 'rgb(var(--surface-card))' }}
            >
              <div className="h-1 w-3/4 rounded" style={{ background: c, opacity: 0.6 }} />
              <div
                className="h-0.5 w-1/2 rounded mt-0.5"
                style={{ background: 'rgba(127,127,140,0.3)' }}
              />
            </div>
          ))}
        </div>

        {/* Buttons demo */}
        <div className="flex gap-1 pt-1">
          <div
            className="px-2 py-1 text-[6px] font-medium text-white"
            style={{
              borderRadius: radiusButton,
              background: `linear-gradient(135deg, ${theme.gradient_from}, ${theme.gradient_to})`,
            }}
          >
            Action
          </div>
          <div
            className="px-2 py-1 text-[6px] font-medium"
            style={{
              borderRadius: radiusButton,
              background: 'rgba(127,127,140,0.15)',
              color: 'var(--text-secondary)',
            }}
          >
            Cancel
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
 *  Página principal
 * ═══════════════════════════════════════════════════════════════════ */
export default function PlantillasPage() {
  const { tenant: active, activeTemplate, refreshTemplate } = useSession();
  const { t } = useLanguage();
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [presets, setPresets] = useState<TemplatePreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyingPreset, setApplyingPreset] = useState<string | null>(null);

  const [previewMode, setPreviewMode] = useState<PreviewMode>('invoice');
  const [rubroFilter, setRubroFilter] = useState<TipoNegocio | 'all' | 'mine'>('mine');
  const [styleFilter, setStyleFilter] = useState<PresetStyle | 'all'>('all');

  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<InvoiceTemplate | null>(null);
  const [editorForm, setEditorForm] = useState<{
    nombre: string;
    slug: string;
    descripcion: string;
    is_default: boolean;
    theme: {
      accent: string;
      gradient_from: string;
      gradient_to: string;
      font: 'inter' | 'mono' | 'serif';
      layout: 'modern' | 'compact' | 'minimal' | 'classic';
      logo_position: 'left' | 'center' | 'right';
      card_style: 'bezel' | 'flat' | 'bordered';
      button_style: 'pill' | 'rounded' | 'sharp';
      sidebar_style: 'glass' | 'solid' | 'minimal';
      typography_scale: 'compact' | 'default' | 'spacious';
      particle_variant: 'particles' | 'aurora' | 'none';
    };
    defaults: { impuesto_pct: number; metodo_pago: string; moneda: string; notas: string };
  }>({
    nombre: '',
    slug: '',
    descripcion: '',
    is_default: false,
    theme: {
      accent: '#7c5cff',
      gradient_from: '#7c5cff',
      gradient_to: '#06b6d4',
      font: 'inter',
      layout: 'modern',
      logo_position: 'left',
      card_style: 'bezel',
      button_style: 'rounded',
      sidebar_style: 'glass',
      typography_scale: 'default',
      particle_variant: 'particles',
    },
    defaults: { impuesto_pct: 0, metodo_pago: 'efectivo', moneda: 'USD', notas: '' },
  });

  const [previewTemplate, setPreviewTemplate] = useState<InvoiceTemplate | null>(null);

  const tenantId = active?.id;
  const loadData = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [tmplRes, presetRes] = await Promise.all([api.listTemplates(), api.listPresets()]);
      setTemplates(tmplRes.data);
      setPresets(presetRes.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error cargando plantillas';
      setError(msg);
      addToast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Default rubro filter to active tenant's tipo_negocio if known
  useEffect(() => {
    if (active?.tipo_negocio) setRubroFilter(active.tipo_negocio);
  }, [active?.tipo_negocio]);

  const filteredPresets = useMemo(() => {
    let list = presets;
    if (rubroFilter === 'mine' && active?.tipo_negocio) {
      list = list.filter(
        (p) => p.tipo_negocio === active.tipo_negocio || p.tipo_negocio == null,
      );
    } else if (rubroFilter !== 'all' && rubroFilter !== 'mine') {
      list = list.filter((p) => p.tipo_negocio === rubroFilter);
    }
    if (styleFilter !== 'all') {
      list = list.filter((p) => p.style === styleFilter);
    }
    return list;
  }, [presets, rubroFilter, styleFilter, active?.tipo_negocio]);

  const handleApplyPreset = async (presetSlug: string) => {
    if (!active) return;
    setApplyingPreset(presetSlug);
    try {
      await api.applyPreset(presetSlug);
      addToast('success', t('templates.appliedOk'));
      await loadData();
      await refreshTemplate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      addToast('error', msg);
    } finally {
      setApplyingPreset(null);
    }
  };

  const openNewEditor = () => {
    setEditing(null);
    setEditorForm({
      nombre: '',
      slug: '',
      descripcion: '',
      is_default: false,
      theme: {
        accent: '#7c5cff',
        gradient_from: '#7c5cff',
        gradient_to: '#06b6d4',
        font: 'inter',
        layout: 'modern',
        logo_position: 'left',
        card_style: 'bezel',
        button_style: 'rounded',
        sidebar_style: 'glass',
        typography_scale: 'default',
        particle_variant: 'particles',
      },
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
        font: (template.theme.font as 'inter' | 'mono' | 'serif') || 'inter',
        layout:
          (template.theme.layout as 'modern' | 'compact' | 'minimal' | 'classic') || 'modern',
        logo_position:
          (template.theme.logo_position as 'left' | 'center' | 'right') || 'left',
        card_style: (template.theme.card_style as 'bezel' | 'flat' | 'bordered') || 'bezel',
        button_style:
          (template.theme.button_style as 'pill' | 'rounded' | 'sharp') || 'rounded',
        sidebar_style:
          (template.theme.sidebar_style as 'glass' | 'solid' | 'minimal') || 'glass',
        typography_scale:
          (template.theme.typography_scale as 'compact' | 'default' | 'spacious') || 'default',
        particle_variant:
          (template.theme.particle_variant as 'particles' | 'aurora' | 'none') || 'particles',
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
        theme: {
          ...editorForm.theme,
          color_primary: editorForm.theme.accent,
          color_secondary: editorForm.theme.gradient_to,
        },
        defaults: editorForm.defaults,
      };
      if (editing) {
        await api.updateTemplate(editing.id, payload);
        addToast('success', t('templates.savedOk'));
      } else {
        await api.createTemplate(payload);
        addToast('success', t('templates.savedOk'));
      }
      setShowEditor(false);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      addToast('error', msg);
    }
  };

  const handleDelete = async (template: InvoiceTemplate) => {
    if (!active) return;
    if (!confirm(`${t('templates.deleteConfirm')} "${template.nombre}"`)) return;
    try {
      await api.deleteTemplate(template.id);
      addToast('success', t('templates.deletedOk'));
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      addToast('error', msg);
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
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="flex items-end justify-between mb-8 flex-wrap gap-4"
      >
        <div>
          <span
            className="text-[11px] uppercase tracking-[0.2em] font-medium"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('nav.templates')}
          </span>
          <SplitText
            text={t('templates.title')}
            tag="h1"
            className="text-3xl font-bold tracking-tight mt-1"
            delay={0.025}
          />
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {t('templates.subtitle')}
          </p>
        </div>
        <ShineButton onClick={openNewEditor} icon={<Plus size={14} />}>
          {t('templates.newTemplate')}
        </ShineButton>
      </motion.div>

      <ErrorBanner
        error={error}
        onRetry={loadData}
        onDismiss={() => setError(null)}
      />

      {/* ── Preview-mode toggle ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE, delay: 0.05 }}
        className="flex items-center justify-between gap-3 mb-6 flex-wrap"
      >
        <div
          className="relative inline-flex p-1 rounded-xl"
          style={{
            background: 'rgb(var(--surface-raised))',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {(['invoice', 'ui'] as const).map((m) => {
            const isActive = previewMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setPreviewMode(m)}
                className="relative px-4 py-2 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                style={{
                  color: isActive
                    ? 'rgb(var(--surface-base))'
                    : 'var(--text-secondary)',
                }}
              >
                {isActive && (
                  <motion.span
                    layoutId="preview-mode-pill"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: 'var(--text-primary)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {m === 'invoice' ? <Receipt size={12} /> : <LayoutGrid size={12} />}
                  {m === 'invoice' ? t('templates.invoicePreview') : t('templates.uiPreview')}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <Filter size={12} style={{ color: 'var(--text-muted)' }} />
          <select
            value={rubroFilter}
            onChange={(e) => setRubroFilter(e.target.value as typeof rubroFilter)}
            className="!py-1.5 !px-2.5 !text-xs"
          >
            <option value="mine">⭐ {t('templates.forYourBusiness')}</option>
            <option value="all">{t('templates.allRubros')}</option>
            <option value="papeleria">📒 papelería</option>
            <option value="carniceria">🥩 carnicería</option>
            <option value="electronica">📱 electrónica</option>
            <option value="generico">📦 genérico</option>
          </select>
          <select
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value as typeof styleFilter)}
            className="!py-1.5 !px-2.5 !text-xs"
          >
            <option value="all">{t('templates.styleAll')}</option>
            <option value="minimal">{t('templates.minimal')}</option>
            <option value="bold">{t('templates.bold')}</option>
            <option value="vibrant">{t('templates.vibrant')}</option>
          </select>
        </div>
      </motion.div>

      {/* ═══ Presets ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4, ease: EASE }}
        className="mb-10"
      >
        <h2
          className="text-[11px] uppercase tracking-[0.15em] font-medium mb-4 flex items-center gap-2"
          style={{ color: 'var(--text-muted)' }}
        >
          <Wand2 size={12} /> {t('templates.applyPreset')}
          <span style={{ color: 'var(--text-secondary)' }} className="ml-1">
            · {filteredPresets.length}
          </span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredPresets.map((preset) => {
              const isActive = activeTemplate?.slug === preset.slug;
              const isApplied = templates.some((tpl) => tpl.slug === preset.slug);
              const isApplying = applyingPreset === preset.slug;
              let buttonLabel: string;
              if (isApplying) buttonLabel = t('templates.applying');
              else if (isActive) buttonLabel = `★ ${t('templates.applied')}`;
              else if (isApplied) buttonLabel = t('templates.apply');
              else buttonLabel = t('templates.apply');
              let buttonStyle: React.CSSProperties;
              if (isActive) {
                buttonStyle = {
                  background: 'rgb(var(--success) / 0.14)',
                  color: 'rgb(var(--success))',
                };
              } else {
                buttonStyle = {
                  background: 'rgb(var(--brand-primary) / 0.1)',
                  color: 'rgb(var(--brand-primary))',
                };
              }
              return (
                <motion.div
                  key={preset.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                  transition={{ duration: 0.25, ease: EASE }}
                >
                  <div
                    className="rounded-2xl overflow-hidden transition-all duration-200"
                    style={{
                      background: 'rgb(var(--surface-card))',
                      border: isActive
                        ? '1px solid rgb(var(--success) / 0.5)'
                        : '1px solid var(--border-subtle)',
                      boxShadow: isActive
                        ? '0 0 0 3px rgb(var(--success) / 0.1)'
                        : undefined,
                    }}
                  >
                    {isActive && (
                      <div
                        className="absolute top-2 right-2 z-10 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full flex items-center gap-1"
                        style={{
                          background: 'rgb(var(--success))',
                          color: 'white',
                        }}
                      >
                        <Star size={9} /> {t('templates.applied')}
                      </div>
                    )}
                    {previewMode === 'invoice' ? (
                      <InvoicePreview theme={preset.theme} />
                    ) : (
                      <UIPreview theme={preset.theme} />
                    )}
                    <div className="p-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-medium text-sm tracking-tight truncate">
                          {preset.nombre}
                        </h3>
                        {preset.style && <StyleBadge style={preset.style} t={t} />}
                      </div>
                      <p
                        className="text-[10px] mt-0.5 line-clamp-2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {preset.descripcion}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleApplyPreset(preset.slug)}
                        disabled={isApplying || isActive}
                        className={cn(
                          'w-full mt-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 disabled:cursor-default',
                        )}
                        style={buttonStyle}
                      >
                        {buttonLabel}
                      </motion.button>
                    </div>
                  </div>
                  <div className="flex gap-1 justify-center mt-2">
                    <span
                      className="w-2 h-2 rounded-full shadow-sm"
                      style={{ backgroundColor: preset.theme.accent }}
                    />
                    <span
                      className="w-2 h-2 rounded-full shadow-sm"
                      style={{ backgroundColor: preset.theme.gradient_from }}
                    />
                    <span
                      className="w-2 h-2 rounded-full shadow-sm"
                      style={{ backgroundColor: preset.theme.gradient_to }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.section>

      {/* ═══ Mis Plantillas ═══ */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4, ease: EASE }}
      >
        <h2
          className="text-[11px] uppercase tracking-[0.15em] font-medium mb-4 flex items-center gap-2"
          style={{ color: 'var(--text-muted)' }}
        >
          <Palette size={12} /> {t('templates.myTemplates')}
        </h2>

        {loading ? (
          <TemplateSkeleton />
        ) : templates.length === 0 ? (
          <div
            className="text-center py-16 rounded-2xl"
            style={{
              background: 'rgb(var(--surface-card))',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgb(var(--surface-raised))' }}
            >
              <Palette size={24} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
            </div>
            <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
              {t('templates.noTemplates')}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {t('templates.applyOrCreate')}
            </p>
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
                  <GlowCard glowColor="rgba(110, 86, 207, 0.12)">
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-20 flex-shrink-0">
                          {previewMode === 'invoice' ? (
                            <InvoicePreview theme={template.theme} />
                          ) : (
                            <UIPreview theme={template.theme} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium tracking-tight text-sm truncate">
                              {template.nombre}
                            </h3>
                            {template.is_default && (
                              <Star
                                size={12}
                                style={{ color: 'rgb(var(--warn))', flexShrink: 0 }}
                              />
                            )}
                          </div>
                          <p
                            className="text-[10px] mt-0.5 line-clamp-2"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {template.descripcion || '—'}
                          </p>
                          <div className="flex gap-1 mt-2 flex-wrap">
                            <span className="badge badge-ghost">
                              <Layout size={8} /> {template.theme.layout || 'modern'}
                            </span>
                            <span className="badge badge-ghost">
                              <Type size={8} /> {template.theme.font || 'inter'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className="flex gap-2 pt-3"
                        style={{ borderTop: '1px solid var(--border-subtle)' }}
                      >
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setPreviewTemplate(template)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors duration-150"
                          style={{
                            background: 'rgb(var(--surface-raised))',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          <Eye size={12} /> {t('templates.preview')}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => openEditEditor(template)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs transition-colors duration-150"
                          style={{
                            background: 'rgb(var(--brand-primary) / 0.1)',
                            color: 'rgb(var(--brand-primary))',
                          }}
                        >
                          <Edit3 size={12} /> {t('common.edit')}
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(template)}
                          className="p-1.5 rounded-lg transition-colors duration-150"
                          style={{ color: 'var(--text-muted)' }}
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

        <div
          className="mt-6 flex items-center gap-2 text-[11px]"
          style={{ color: 'var(--text-muted)' }}
        >
          <Sparkles size={11} style={{ color: 'rgb(var(--brand-primary))' }} />
          <span>{t('templates.skinChange')}</span>
        </div>
      </motion.section>

      {/* ═══ Editor Modal ═══ */}
      <Modal
        open={showEditor}
        onClose={() => setShowEditor(false)}
        title={editing ? t('templates.editTemplate') : t('templates.newTemplate')}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField label={`${t('common.name')} *`}>
              <input
                type="text"
                value={editorForm.nombre}
                onChange={(e) => setEditorForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Ej: Mi Plantilla Profesional"
                className="w-full"
              />
            </FormField>
            <FormField label="Slug *">
              <input
                type="text"
                value={editorForm.slug}
                onChange={(e) =>
                  setEditorForm((f) => ({
                    ...f,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
                  }))
                }
                placeholder="mi-plantilla"
                className="w-full font-mono text-sm"
              />
            </FormField>
            <FormField label={t('inventory.description')}>
              <textarea
                value={editorForm.descripcion}
                onChange={(e) =>
                  setEditorForm((f) => ({ ...f, descripcion: e.target.value }))
                }
                rows={2}
                className="w-full resize-none"
              />
            </FormField>

            <FormField label="Colores">
              <div className="grid grid-cols-3 gap-3">
                <ColorPicker
                  label="Acento"
                  value={editorForm.theme.accent}
                  onChange={(v) =>
                    setEditorForm((f) => ({ ...f, theme: { ...f.theme, accent: v } }))
                  }
                />
                <ColorPicker
                  label="Grad. inicio"
                  value={editorForm.theme.gradient_from}
                  onChange={(v) =>
                    setEditorForm((f) => ({ ...f, theme: { ...f.theme, gradient_from: v } }))
                  }
                />
                <ColorPicker
                  label="Grad. fin"
                  value={editorForm.theme.gradient_to}
                  onChange={(v) =>
                    setEditorForm((f) => ({ ...f, theme: { ...f.theme, gradient_to: v } }))
                  }
                />
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Layout">
                <select
                  value={editorForm.theme.layout}
                  onChange={(e) =>
                    setEditorForm((f) => ({
                      ...f,
                      theme: {
                        ...f.theme,
                        layout: e.target.value as typeof f.theme.layout,
                      },
                    }))
                  }
                  className="w-full"
                >
                  <option value="modern">Modern</option>
                  <option value="compact">Compact</option>
                  <option value="minimal">Minimal</option>
                  <option value="classic">Classic</option>
                </select>
              </FormField>
              <FormField label="Fuente">
                <select
                  value={editorForm.theme.font}
                  onChange={(e) =>
                    setEditorForm((f) => ({
                      ...f,
                      theme: {
                        ...f.theme,
                        font: e.target.value as typeof f.theme.font,
                      },
                    }))
                  }
                  className="w-full"
                >
                  <option value="inter">Inter</option>
                  <option value="mono">Mono</option>
                  <option value="serif">Serif</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Card style">
                <select
                  value={editorForm.theme.card_style}
                  onChange={(e) =>
                    setEditorForm((f) => ({
                      ...f,
                      theme: {
                        ...f.theme,
                        card_style: e.target.value as typeof f.theme.card_style,
                      },
                    }))
                  }
                  className="w-full"
                >
                  <option value="bezel">Bezel</option>
                  <option value="flat">Flat</option>
                  <option value="bordered">Bordered</option>
                </select>
              </FormField>
              <FormField label="Button style">
                <select
                  value={editorForm.theme.button_style}
                  onChange={(e) =>
                    setEditorForm((f) => ({
                      ...f,
                      theme: {
                        ...f.theme,
                        button_style: e.target.value as typeof f.theme.button_style,
                      },
                    }))
                  }
                  className="w-full"
                >
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                  <option value="sharp">Sharp</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Sidebar">
                <select
                  value={editorForm.theme.sidebar_style}
                  onChange={(e) =>
                    setEditorForm((f) => ({
                      ...f,
                      theme: {
                        ...f.theme,
                        sidebar_style: e.target.value as typeof f.theme.sidebar_style,
                      },
                    }))
                  }
                  className="w-full"
                >
                  <option value="glass">Glass</option>
                  <option value="solid">Solid</option>
                  <option value="minimal">Minimal</option>
                </select>
              </FormField>
              <FormField label="Type scale">
                <select
                  value={editorForm.theme.typography_scale}
                  onChange={(e) =>
                    setEditorForm((f) => ({
                      ...f,
                      theme: {
                        ...f.theme,
                        typography_scale: e.target
                          .value as typeof f.theme.typography_scale,
                      },
                    }))
                  }
                  className="w-full"
                >
                  <option value="compact">Compact</option>
                  <option value="default">Default</option>
                  <option value="spacious">Spacious</option>
                </select>
              </FormField>
            </div>

            <FormField label="Background">
              <select
                value={editorForm.theme.particle_variant}
                onChange={(e) =>
                  setEditorForm((f) => ({
                    ...f,
                    theme: {
                      ...f.theme,
                      particle_variant: e.target.value as typeof f.theme.particle_variant,
                    },
                  }))
                }
                className="w-full"
              >
                <option value="particles">Particles</option>
                <option value="aurora">Aurora</option>
                <option value="none">None</option>
              </select>
            </FormField>

            <label className="flex items-center gap-2 text-xs cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={editorForm.is_default}
                onChange={(e) =>
                  setEditorForm((f) => ({ ...f, is_default: e.target.checked }))
                }
                className="!w-auto"
              />
              <span style={{ color: 'var(--text-secondary)' }}>
                Usar como plantilla por defecto (skin global)
              </span>
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] uppercase tracking-[0.12em] font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                Live preview
              </span>
              <div
                className="inline-flex p-0.5 rounded-lg"
                style={{
                  background: 'rgb(var(--surface-raised))',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {(['invoice', 'ui'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPreviewMode(m)}
                    className="px-2 py-1 text-[10px] rounded-md transition-colors"
                    style={{
                      background:
                        previewMode === m ? 'var(--text-primary)' : 'transparent',
                      color:
                        previewMode === m
                          ? 'rgb(var(--surface-base))'
                          : 'var(--text-secondary)',
                    }}
                  >
                    {m === 'invoice' ? 'Invoice' : 'UI'}
                  </button>
                ))}
              </div>
            </div>
            <div className="max-w-[260px] mx-auto">
              {previewMode === 'invoice' ? (
                <InvoicePreview theme={editorForm.theme} />
              ) : (
                <UIPreview theme={editorForm.theme} />
              )}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              <div
                className="w-10 h-10 rounded-xl shadow-lg"
                style={{
                  backgroundColor: editorForm.theme.accent,
                  border: '1px solid var(--border-subtle)',
                }}
              />
              <div
                className="w-10 h-10 rounded-xl shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${editorForm.theme.gradient_from}, ${editorForm.theme.gradient_to})`,
                  border: '1px solid var(--border-subtle)',
                }}
              />
            </div>
          </div>
        </div>

        <div
          className="flex gap-3 mt-6 pt-4"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <ShineButton variant="ghost" className="flex-1" onClick={() => setShowEditor(false)}>
            {t('common.cancel')}
          </ShineButton>
          <ShineButton
            variant="primary"
            className="flex-1"
            onClick={handleSave}
            icon={<Check size={14} />}
          >
            {t('common.save')}
          </ShineButton>
        </div>
      </Modal>

      {/* ═══ Preview Modal ═══ */}
      <Modal
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate?.nombre || ''}
        size="md"
      >
        {previewTemplate && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span
                  className="text-[10px] uppercase tracking-wider block mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t('templates.invoicePreview')}
                </span>
                <InvoicePreview theme={previewTemplate.theme} />
              </div>
              <div>
                <span
                  className="text-[10px] uppercase tracking-wider block mb-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t('templates.uiPreview')}
                </span>
                <UIPreview theme={previewTemplate.theme} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <InfoChip label="Layout" value={previewTemplate.theme.layout || 'modern'} />
              <InfoChip label="Font" value={previewTemplate.theme.font || 'inter'} />
              <InfoChip
                label="Card"
                value={previewTemplate.theme.card_style || 'bezel'}
              />
              <InfoChip
                label="Button"
                value={previewTemplate.theme.button_style || 'rounded'}
              />
              <InfoChip
                label="Sidebar"
                value={previewTemplate.theme.sidebar_style || 'glass'}
              />
              <InfoChip
                label="BG"
                value={previewTemplate.theme.particle_variant || 'particles'}
              />
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

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{
        background: 'rgb(var(--surface-card))',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <span
        className="text-[10px] uppercase tracking-wider block mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      <span className="font-medium capitalize text-sm">{value}</span>
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] mb-1 block" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent !p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full !py-1.5 font-mono text-xs"
        />
      </div>
    </div>
  );
}

function StyleBadge({ style, t }: { style: PresetStyle; t: (k: string) => string }) {
  const map: Record<PresetStyle, { color: string; bg: string }> = {
    minimal: { color: 'rgb(var(--info))', bg: 'rgb(var(--info) / 0.12)' },
    bold: { color: 'rgb(var(--warn))', bg: 'rgb(var(--warn) / 0.12)' },
    vibrant: { color: 'rgb(var(--brand-primary))', bg: 'rgb(var(--brand-primary) / 0.12)' },
  };
  const { color, bg } = map[style];
  return (
    <span
      className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded"
      style={{ color, background: bg }}
    >
      {t(`templates.${style}`)}
    </span>
  );
}

function TemplateSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="shimmer-bg animate-shimmer rounded-2xl h-48"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}
