const templateRepo = require('../repositories/template.repository');
const { validateTemplate, PRESET_TEMPLATES } = require('../../../shared/schemas');

class TemplateServiceError extends Error {
  constructor(message, { status = 400, code = 'template_error', details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function list(tenant) {
  return templateRepo.listByTenant(tenant.id);
}

async function getById(tenant, id) {
  const t = await templateRepo.findById(tenant.id, id);
  if (!t) throw new TemplateServiceError('Plantilla no encontrada', { status: 404, code: 'not_found' });
  return t;
}

async function create(tenant, payload) {
  let validated;
  try {
    validated = validateTemplate(payload);
  } catch (err) {
    throw new TemplateServiceError('Plantilla inválida', {
      status: 422,
      code: 'invalid_template',
      details: err.issues || err.message,
    });
  }
  return templateRepo.create(tenant.id, validated);
}

async function update(tenant, id, payload) {
  let validated;
  try {
    validated = validateTemplate(payload, { partial: true });
  } catch (err) {
    throw new TemplateServiceError('Plantilla inválida', {
      status: 422,
      code: 'invalid_template',
      details: err.issues || err.message,
    });
  }
  const updated = await templateRepo.update(tenant.id, id, validated);
  if (!updated) throw new TemplateServiceError('Plantilla no encontrada', { status: 404, code: 'not_found' });
  return updated;
}

async function remove(tenant, id) {
  const ok = await templateRepo.remove(tenant.id, id);
  if (!ok) throw new TemplateServiceError('Plantilla no encontrada', { status: 404, code: 'not_found' });
  return { deleted: true };
}

/**
 * Aplica un preset (definido en shared) como plantilla real para el tenant.
 * Si ya existe una plantilla con ese slug, se actualiza; de lo contrario
 * se crea.
 *
 * SIEMPRE se marca como `is_default: true` para que el skin del app cambie
 * inmediatamente. El repo desmarca automáticamente el anterior default en
 * la misma transacción, respetando el índice único parcial.
 */
async function applyPreset(tenant, presetSlug) {
  const preset = PRESET_TEMPLATES.find((p) => p.slug === presetSlug);
  if (!preset) {
    throw new TemplateServiceError('Preset no existe', { status: 404, code: 'preset_not_found' });
  }
  // Clonar el preset y filtrar campos que no pertenecen al schema de
  // invoice_templates (tipo_negocio/style viven sólo en la tabla de presets).
  const { tipo_negocio: _tn, style: _st, ...cleanPreset } = preset;
  const payload = { ...cleanPreset, is_default: true };

  const existing = (await templateRepo.listByTenant(tenant.id)).find((t) => t.slug === preset.slug);
  if (existing) {
    return templateRepo.update(tenant.id, existing.id, payload);
  }
  return templateRepo.create(tenant.id, payload);
}

function listPresets() {
  return PRESET_TEMPLATES;
}

module.exports = { list, getById, create, update, remove, applyPreset, listPresets, TemplateServiceError };
