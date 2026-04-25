# Solanium · Postman pack

Pack listo para importar en Postman / Insomnia / Bruno y validar **toda** la API
del backend Solanium en una sola corrida del Collection Runner.

## Archivos

- [solanium.postman_collection.json](solanium.postman_collection.json) — colección con todos los endpoints agrupados por dominio.
- [solanium.local.postman_environment.json](solanium.local.postman_environment.json) — environment local (apunta a `http://localhost:4000`).

## Pre-requisitos

1. Backend corriendo:
   ```bash
   cd backend
   npm install
   npm run migrate
   npm run seed:test
   npm run dev
   ```
2. Postgres del `docker-compose.yml` activo (puerto 5433 según `backend/.env`).
3. La key maestra `SOLANIUM_SUPER_ADMIN_KEY` debe coincidir con la del environment
   (default: `solanium-dev-master-key`).

## Cómo importar

1. Abre Postman → **Import** → arrastra los dos archivos.
2. Selecciona el environment **Solanium · Local** en el dropdown superior derecho.
3. Click derecho sobre la colección → **Run collection** → **Run Solanium · API completa**.

## Orden de ejecución (folders)

| # | Folder | Qué valida |
|---|---|---|
| 0 | Setup | `/health`, `current-code`, `verify` (code y Bearer) |
| 1 | Tenants | Listado público + `current` |
| 2 | Activation | `mine` |
| 3 | Users | `login`, `me`, list, create, get, update |
| 4 | Customers | list, create, get, update |
| 5 | Products | list, create, get, update, `adjust-stock` (validación stock final = 35) |
| 6 | Templates | `presets`, list tenant, `apply-preset`, create, get, update |
| 7 | Invoices | `summary`, list, create (totales calculados en backend), get, `mark-paid`, `send-email`, update |
| 8 | Super-admin | `super-admins`, list activations, **onboard nuevo tenant**, verify, `refresh-code`, `renew`, `revoke` |
| 9 | Cleanup | DELETE invoice → template → product → customer → user; sanity 401/403 |

## Variables que la colección autocompleta

Estas variables se setean a lo largo de la corrida — no hace falta editarlas:

`session_token`, `tenant_id`, `activation_id`, `current_code`,
`logged_user_id`, `created_user_id`, `customer_id`, `product_id`,
`template_id`, `invoice_id`, `new_tenant_id`, `new_tenant_slug`,
`new_activation_id`, `new_session_token`, `new_code`, `run_stamp`.

`run_stamp` es un `Date.now()` único por corrida que se usa como sufijo en
slugs / SKUs / emails para evitar colisiones de unique constraints al
re-ejecutar la colección.

## Idempotencia

- Cada recurso creado en la corrida se elimina en el folder **Cleanup**.
- El tenant onboardeado en el folder Super-admin queda con la activación
  revocada (no se borra la fila de tenant — Postgres no permite borrarlo
  con datos relacionados, pero el access queda anulado).
- Re-ejecutar la colección en el mismo backend funciona indefinidamente.

## Aserciones globales

- Todos los requests fallan si la respuesta es `>= 500`.
- Cada request individual asserta su status code esperado y, cuando aplica,
  campos clave (id, slug, totales, deleted=true, etc.).

## Credenciales de prueba (seed)

Tras `npm run seed:test`:

| Tenant | Slug | tipo_negocio | Admin email |
|---|---|---|---|
| Papelería Central | `papeleria-central` | papeleria | `admin@papeleria.dev` |
| Carnicería La Res | `carniceria-la-res` | carniceria | `admin@carniceria.dev` |
| Electro Hub | `electro-hub` | electronica | `admin@electronica.dev` |
| Solanium Demo | `generico-demo` | generico | `admin@generico.dev` |

Password común: `*usuario123` · Super-admin: `super@solanium.dev`.

## Tips

- **Cambiar de tenant para probar otro rubro:** edita `tenant_slug` y `admin_email`
  en el environment y vuelve a correr. Los productos creados respetan los metadata
  schemas del rubro (papelería en la colección por default — ver folder Products).
- **CLI con Newman:**
  ```bash
  npx newman run docs/postman/solanium.postman_collection.json \
    -e docs/postman/solanium.local.postman_environment.json \
    --reporters cli,json --reporter-json-export newman-report.json
  ```
- **Si un request da 401:** el `session_token` expiró. Re-ejecuta el folder
  **Setup** y continúa.
