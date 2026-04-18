import type { TipoNegocio } from './api';

export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'date';

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

/**
 * Mapa declarativo de campos extra por rubro.
 * La UI del formulario se renderiza dinámicamente a partir de esta tabla.
 * Debe mantenerse alineada con `shared/schemas/product.schema.js`.
 */
export const METADATA_FIELDS: Record<TipoNegocio, FieldDef[]> = {
  carniceria: [
    { name: 'unidad_medida', label: 'Unidad de medida', type: 'select', required: true, options: ['kg', 'g', 'libra', 'unidad'] },
    { name: 'requiere_refrigeracion', label: 'Requiere refrigeración', type: 'boolean', required: true },
    { name: 'temperatura_min_c', label: 'Temperatura mínima (°C)', type: 'number', min: -40, max: 20, step: 0.5 },
    { name: 'temperatura_max_c', label: 'Temperatura máxima (°C)', type: 'number', min: -40, max: 20, step: 0.5 },
    { name: 'fecha_empaque', label: 'Fecha de empaque', type: 'date' },
    { name: 'fecha_vencimiento', label: 'Fecha de vencimiento', type: 'date' },
    { name: 'proveedor', label: 'Proveedor', type: 'text' },
    { name: 'origen', label: 'Origen', type: 'text' },
    { name: 'corte', label: 'Corte', type: 'text', placeholder: 'ej. Lomo, Costilla' },
  ],
  electronica: [
    { name: 'marca', label: 'Marca', type: 'text', required: true },
    { name: 'modelo', label: 'Modelo', type: 'text', required: true },
    { name: 'serial', label: 'Serial', type: 'text' },
    { name: 'garantia_meses', label: 'Garantía (meses)', type: 'number', required: true, min: 0, max: 120 },
    { name: 'voltaje', label: 'Voltaje', type: 'text', placeholder: '110V / 220V' },
    { name: 'potencia_w', label: 'Potencia (W)', type: 'number', min: 0 },
    { name: 'color', label: 'Color', type: 'text' },
  ],
  papeleria: [
    { name: 'presentacion', label: 'Presentación', type: 'text', required: true, placeholder: 'Caja, Unidad, Resma' },
    { name: 'unidades_por_paquete', label: 'Unidades por paquete', type: 'number', min: 1, step: 1 },
    { name: 'marca', label: 'Marca', type: 'text' },
    { name: 'color', label: 'Color', type: 'text' },
    { name: 'material', label: 'Material', type: 'text' },
  ],
  generico: [],
};
