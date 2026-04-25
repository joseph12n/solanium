'use client';

/**
 * LanguageContext — i18n minimalista para ES/EN.
 * Diccionario estático; persistido en localStorage.
 * Se usa como `t('key')` desde los componentes.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'es' | 'en';

const STORAGE_KEY = 'solanium.lang';

type Dictionary = Record<string, { es: string; en: string }>;

const DICTIONARY: Dictionary = {
  // ── Nav
  'nav.home': { es: 'Inicio', en: 'Home' },
  'nav.invoicing': { es: 'Facturación', en: 'Invoicing' },
  'nav.customers': { es: 'Clientes', en: 'Customers' },
  'nav.templates': { es: 'Plantillas', en: 'Templates' },
  'nav.users': { es: 'Usuarios', en: 'Users' },
  'nav.inventory': { es: 'Inventario', en: 'Inventory' },
  'nav.catalog': { es: 'Catálogo', en: 'Catalog' },
  'nav.cuts': { es: 'Cortes', en: 'Cuts' },
  'nav.stock': { es: 'Stock', en: 'Stock' },

  // ── Common
  'common.loading': { es: 'Cargando…', en: 'Loading…' },
  'common.save': { es: 'Guardar', en: 'Save' },
  'common.cancel': { es: 'Cancelar', en: 'Cancel' },
  'common.delete': { es: 'Eliminar', en: 'Delete' },
  'common.edit': { es: 'Editar', en: 'Edit' },
  'common.create': { es: 'Crear', en: 'Create' },
  'common.new': { es: 'Nuevo', en: 'New' },
  'common.search': { es: 'Buscar…', en: 'Search…' },
  'common.confirm': { es: 'Confirmar', en: 'Confirm' },
  'common.close': { es: 'Cerrar', en: 'Close' },
  'common.back': { es: 'Volver', en: 'Back' },
  'common.name': { es: 'Nombre', en: 'Name' },
  'common.price': { es: 'Precio', en: 'Price' },
  'common.stock': { es: 'Stock', en: 'Stock' },
  'common.actions': { es: 'Acciones', en: 'Actions' },
  'common.status': { es: 'Estado', en: 'Status' },
  'common.total': { es: 'Total', en: 'Total' },
  'common.date': { es: 'Fecha', en: 'Date' },
  'common.email': { es: 'Email', en: 'Email' },
  'common.phone': { es: 'Teléfono', en: 'Phone' },
  'common.address': { es: 'Dirección', en: 'Address' },
  'common.document': { es: 'Documento', en: 'Document' },
  'common.role': { es: 'Rol', en: 'Role' },
  'common.password': { es: 'Contraseña', en: 'Password' },
  'common.none': { es: 'Ninguno', en: 'None' },
  'common.all': { es: 'Todas', en: 'All' },
  'common.view': { es: 'Ver', en: 'View' },
  'common.apply': { es: 'Aplicar', en: 'Apply' },
  'common.copy': { es: 'Copiar', en: 'Copy' },
  'common.copied': { es: 'Copiado', en: 'Copied' },

  // ── Dashboard
  'dashboard.welcome': { es: 'Hola', en: 'Hello' },
  'dashboard.yourPanel': { es: 'Tu panel de', en: 'Your' },
  'dashboard.isReady': { es: 'está listo.', en: 'panel is ready.' },
  'dashboard.mainModules': { es: 'Módulos principales', en: 'Main modules' },
  'dashboard.todaysIncome': { es: 'Ingresos hoy', en: "Today's income" },
  'dashboard.todaysInvoices': { es: 'Facturas hoy', en: "Today's invoices" },
  'dashboard.totalIncome': { es: 'Ingresos totales', en: 'Total income' },
  'dashboard.totalInvoices': { es: 'Total facturas', en: 'Total invoices' },
  'dashboard.licenseValid': { es: 'Licencia vigente', en: 'License active' },
  'dashboard.days': { es: 'días', en: 'days' },
  'dashboard.newInvoice': { es: 'Nueva factura', en: 'New invoice' },
  'dashboard.customizeTemplate': { es: 'Personalizar plantilla', en: 'Customize template' },

  // ── Invoicing
  'invoicing.title': { es: 'Facturación', en: 'Invoicing' },
  'invoicing.pos': { es: 'Punto de venta', en: 'Point of sale' },
  'invoicing.history': { es: 'Historial', en: 'History' },
  'invoicing.cart': { es: 'Carrito', en: 'Cart' },
  'invoicing.products': { es: 'Productos', en: 'Products' },
  'invoicing.customer': { es: 'Cliente', en: 'Customer' },
  'invoicing.emit': { es: 'Emitir factura', en: 'Issue invoice' },
  'invoicing.subtotal': { es: 'Subtotal', en: 'Subtotal' },
  'invoicing.tax': { es: 'Impuesto', en: 'Tax' },
  'invoicing.paymentMethod': { es: 'Método de pago', en: 'Payment method' },
  'invoicing.number': { es: 'Número', en: 'Number' },
  'invoicing.emitted': { es: 'Emitida', en: 'Issued' },
  'invoicing.paid': { es: 'Pagada', en: 'Paid' },
  'invoicing.draft': { es: 'Borrador', en: 'Draft' },
  'invoicing.void': { es: 'Anulada', en: 'Void' },
  'invoicing.markPaid': { es: 'Marcar pagada', en: 'Mark as paid' },
  'invoicing.voidIt': { es: 'Anular', en: 'Void' },
  'invoicing.print': { es: 'Imprimir', en: 'Print' },
  'invoicing.sendEmail': { es: 'Enviar por email', en: 'Send by email' },
  'invoicing.detail': { es: 'Detalle', en: 'Detail' },
  'invoicing.empty': { es: 'Sin facturas aún', en: 'No invoices yet' },
  'invoicing.emptyCart': { es: 'El carrito está vacío', en: 'Your cart is empty' },

  // ── Inventory
  'inventory.title': { es: 'Inventario', en: 'Inventory' },
  'inventory.sku': { es: 'SKU', en: 'SKU' },
  'inventory.unit': { es: 'Unidad', en: 'Unit' },
  'inventory.description': { es: 'Descripción', en: 'Description' },
  'inventory.totalItems': { es: 'Ítems totales', en: 'Total items' },
  'inventory.lowStock': { es: 'Stock bajo', en: 'Low stock' },
  'inventory.inventoryValue': { es: 'Valor inventario', en: 'Inventory value' },
  'inventory.addItem': { es: 'Agregar ítem', en: 'Add item' },
  'inventory.priceHistory': { es: 'Historial de precios', en: 'Price history' },
  'inventory.noPriceHistory': { es: 'Sin cambios de precio aún', en: 'No price changes yet' },
  'inventory.stockAlert': {
    es: 'Productos con stock bajo — revisa tu catálogo',
    en: 'Low-stock products — review your catalog',
  },

  // ── Customers
  'customers.title': { es: 'Clientes', en: 'Customers' },
  'customers.empty': { es: 'Sin clientes aún', en: 'No customers yet' },
  'customers.addCustomer': { es: 'Nuevo cliente', en: 'New customer' },
  'customers.viewInvoices': { es: 'Ver facturas', en: 'View invoices' },

  // ── Templates
  'templates.title': { es: 'Plantillas', en: 'Templates' },
  'templates.applyPreset': { es: 'Aplicar preset', en: 'Apply preset' },
  'templates.uiPreview': { es: 'Vista UI', en: 'UI preview' },
  'templates.invoicePreview': { es: 'Vista factura', en: 'Invoice preview' },
  'templates.minimal': { es: 'Minimal', en: 'Minimal' },
  'templates.bold': { es: 'Bold', en: 'Bold' },
  'templates.vibrant': { es: 'Vibrant', en: 'Vibrant' },
  'templates.universal': { es: 'Universales', en: 'Universal' },
  'templates.forYourBusiness': { es: 'Para tu rubro', en: 'For your business' },

  // ── Users
  'users.title': { es: 'Usuarios', en: 'Users' },
  'users.invite': { es: 'Invitar usuario', en: 'Invite user' },
  'users.admin': { es: 'Administrador', en: 'Administrator' },
  'users.operator': { es: 'Operador', en: 'Operator' },
  'users.readonly': { es: 'Solo lectura', en: 'Read only' },
  'users.lastLogin': { es: 'Último ingreso', en: 'Last login' },
  'users.neverLogged': { es: 'Nunca ingresó', en: 'Never logged in' },
  'users.tempPassword': {
    es: 'Contraseña temporal — guárdala ahora, no se mostrará de nuevo.',
    en: 'Temporary password — save it now, it will not be shown again.',
  },

  // ── Login
  'login.tagline': { es: 'SaaS de facturación universal', en: 'Universal billing SaaS' },
  'login.heroLine1': { es: 'Tu sistema,', en: 'Your system,' },
  'login.heroLine2': { es: 'hecho a medida.', en: 'tailor-made.' },
  'login.builtFor': { es: 'Pensado para', en: 'Built for' },
  'login.rubro.papeleria': { es: 'papelerías', en: 'stationery shops' },
  'login.rubro.carniceria': { es: 'carnicerías', en: 'butcher shops' },
  'login.rubro.electronica': { es: 'electrónica', en: 'electronics stores' },
  'login.rubro.yours': { es: 'tu rubro', en: 'your business' },
  'login.heroDescription': {
    es: 'Introduce el código de 6 dígitos que recibiste al contratar tu suscripción. Rota cada 15 minutos; el sistema reconocerá tu rubro y adaptará el panel a tu negocio.',
    en: 'Enter the 6-digit code you received when subscribing. It rotates every 15 minutes; the system recognizes your business type and adapts the panel to it.',
  },
  'login.feat.validity': { es: '30 días vigentes', en: '30 days valid' },
  'login.feat.validityHint': { es: 'por suscripción', en: 'per subscription' },
  'login.feat.branding': { es: 'Branding propio', en: 'Your branding' },
  'login.feat.brandingHint': { es: 'logo + colores', en: 'logo + colors' },
  'login.feat.rotating': { es: 'Código rotatorio', en: 'Rotating code' },
  'login.feat.rotatingHint': { es: 'cada 15 min', en: 'every 15 min' },
  'login.noCodeYet': { es: '¿No tienes código aún?', en: 'No code yet?' },
  'login.contactVendor': {
    es: 'Contacta a tu vendedor Solanium para recibir tu suscripción mensual o anual.',
    en: 'Contact your Solanium reseller to receive your monthly or annual subscription.',
  },
  'login.step1': { es: 'Paso 1 · Activación', en: 'Step 1 · Activation' },
  'login.signIn': { es: 'Iniciar sesión', en: 'Sign in' },
  'login.enterWith': { es: 'Entra con tu', en: 'Enter with your' },
  'login.codeWord': { es: 'código', en: 'code' },
  'login.welcomeBack': { es: 'Bienvenido de vuelta', en: 'Welcome back' },
  'login.codeRotates': {
    es: 'Introduce el código de 6 dígitos vigente. Rota cada 15 minutos.',
    en: 'Enter the active 6-digit code. It rotates every 15 minutes.',
  },
  'login.signInHint': {
    es: 'Ingresa con tu cuenta del equipo para continuar.',
    en: 'Sign in with your team account to continue.',
  },
  'login.tab.activate': { es: 'Activar', en: 'Activate' },
  'login.tab.signIn': { es: 'Iniciar sesión', en: 'Sign in' },
  'login.accessCode': { es: 'Código de acceso', en: 'Access code' },
  'login.sixDigits': { es: '6 dígitos · rota c/15 min', en: '6 digits · rotates every 15 min' },
  'login.validating': { es: 'Validando…', en: 'Validating…' },
  'login.activate': { es: 'Activar sistema', en: 'Activate system' },
  'login.enter': { es: 'Entrar', en: 'Enter' },
  'login.terms': {
    es: 'Al continuar aceptas las condiciones del plan Solanium.',
    en: 'By continuing you accept the Solanium plan terms.',
  },
  'login.invalidCredentials': {
    es: 'No pudimos validar tus credenciales',
    en: 'Could not validate your credentials',
  },

  // ── Templates (extras)
  'templates.subtitle': {
    es: 'Personaliza el diseño visual de tus facturas con presets o crea las tuyas',
    en: 'Customize the visual design of your invoices with presets or create your own',
  },
  'templates.newTemplate': { es: 'Nueva plantilla', en: 'New template' },
  'templates.editTemplate': { es: 'Editar plantilla', en: 'Edit template' },
  'templates.applied': { es: 'Aplicado', en: 'Applied' },
  'templates.apply': { es: 'Aplicar', en: 'Apply' },
  'templates.applying': { es: 'Aplicando…', en: 'Applying…' },
  'templates.myTemplates': { es: 'Mis plantillas', en: 'My templates' },
  'templates.noTemplates': { es: 'Aún no tienes plantillas propias', en: "You don't have any templates yet" },
  'templates.applyOrCreate': { es: 'Aplica un preset o crea una personalizada', en: 'Apply a preset or create a custom one' },
  'templates.preview': { es: 'Preview', en: 'Preview' },
  'templates.allRubros': { es: 'Todos los rubros', en: 'All business types' },
  'templates.styleAll': { es: 'Todos los estilos', en: 'All styles' },
  'templates.deleteConfirm': { es: '¿Eliminar la plantilla?', en: 'Delete this template?' },
  'templates.savedOk': { es: 'Plantilla guardada', en: 'Template saved' },
  'templates.appliedOk': { es: 'Preset aplicado correctamente', en: 'Preset applied successfully' },
  'templates.deletedOk': { es: 'Plantilla eliminada', en: 'Template deleted' },
  'templates.skinChange': {
    es: 'El skin global cambia al aplicar una plantilla por defecto.',
    en: 'The global skin updates when you apply a default template.',
  },
};

export interface LanguageValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageValue | undefined>(undefined);

function readInitial(): Lang {
  if (typeof window === 'undefined') return 'es';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'es' || stored === 'en') return stored;
  return 'es';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    setLangState(readInitial());
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }, []);

  const t = useCallback(
    (key: string, fallback?: string) => {
      const entry = DICTIONARY[key];
      if (!entry) return fallback ?? key;
      return entry[lang] || entry.es;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage debe usarse dentro de <LanguageProvider>');
  return ctx;
}
