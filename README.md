# Solanium

Sistema de facturacion SaaS multi-tenant para negocios reales.
Un solo producto. Multiples rubros. Cero friccion para activar.

Solanium permite que cada cliente entre con su token de activacion y reciba una experiencia adaptada a su negocio (branding, lenguaje y flujo), sin configuraciones manuales por tenant.

---

## Tabla de contenido

- [Vision](#vision)
- [Que problema resuelve](#que-problema-resuelve)
- [Flujo del sistema en 30 segundos](#flujo-del-sistema-en-30-segundos)
- [Arquitectura](#arquitectura)
- [Stack tecnologico](#stack-tecnologico)
- [Inicio rapido](#inicio-rapido)
- [Onboarding SaaS (super-admin y activacion)](#onboarding-saas-super-admin-y-activacion)
- [Autenticacion y sesion](#autenticacion-y-sesion)
- [Scripts del monorepo](#scripts-del-monorepo)
- [Variables de entorno](#variables-de-entorno)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Convenciones tecnicas](#convenciones-tecnicas)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Vision

Construir un sistema de facturacion universal, elegante y escalable, donde el software se adapta al cliente y no al reves.

Solanium separa claramente:

- Capa SaaS (emision y verificacion de tokens)
- Capa de negocio (productos, facturas, clientes, plantillas)
- Capa de experiencia (frontend adaptado por rubro)

---

## Que problema resuelve

La mayoria de soluciones de facturacion fallan en uno de estos extremos:

- Son rigidas y solo sirven para un tipo de negocio.
- Son tan configurables que la puesta en marcha se vuelve lenta y confusa.

Solanium toma una ruta practica:

1. El super-admin emite un token de activacion con vigencia.
2. El cliente pega el token en login.
3. El sistema identifica tenant, rubro, branding y plan.
4. La interfaz se adapta automaticamente.

Resultado: activacion rapida, experiencia consistente y arquitectura multitenant limpia.

---

## Flujo del sistema en 30 segundos

```text
Super-admin emite token (/api/activation/onboard)
                |
                v
Cliente pega token en /login
                |
                v
Backend verifica token (/api/activation/verify)
                |
                v
Frontend guarda sesion y tenant (localStorage)
                |
                v
API opera con Bearer token auto-inyectado
```

---

## Arquitectura

### Frontend

- Next.js 14 (App Router)
- Tailwind CSS
- ReactBits + Framer Motion para una UI viva y adaptable
- SessionProvider para proteger rutas y mantener estado de sesion

### Backend

- Node.js + Express
- Patron Controller -> Service -> Repository
- Middleware de auth con Bearer como mecanismo principal
- Endpoints de dominio por modulo (productos, clientes, facturas, etc.)

### Datos

- PostgreSQL 16
- Modelo relacional multitenant
- `metadata` en JSONB para flexibilidad por rubro

---

## Stack tecnologico

| Capa | Tecnologia |
|---|---|
| Frontend | Next.js 14 + Tailwind CSS |
| UI y animacion | ReactBits + Framer Motion |
| Backend | Node.js + Express |
| Persistencia | PostgreSQL 16 |
| Validacion | Zod (`shared/schemas`) |
| Infra local | Docker Compose |
| Auth | Bearer token de activacion |

---

## Inicio rapido

### Requisitos

- Node.js 18+
- npm 9+
- Docker y Docker Compose

### 1) Clonar e instalar

```bash
git clone https://github.com/joseph12n/solanium.git
cd solanium
npm install
```

### 2) Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

En PowerShell:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

### 3) Levantar base de datos

```bash
npm run db:up
```

### 4) Ejecutar migraciones

```bash
npm run migrate
```

### 5) Iniciar desarrollo

```bash
npm run dev:backend
npm run dev:frontend
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Healthcheck backend: http://localhost:4000/health

Nota: el `docker-compose.yml` raiz expone Postgres en `5433:5432`. Si usas ese archivo, ajusta `PGPORT=5433` en `backend/.env`.

---

## Onboarding SaaS (super-admin y activacion)

### 1) Crear super-admin (bootstrap inicial)

```bash
curl -X POST http://localhost:4000/api/users/super-admins \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Tu Nombre",
    "email": "admin@tuempresa.com",
    "password": "tu_password_segura"
  }'
```

### 2) Emitir token de activacion

```bash
curl -X POST http://localhost:4000/api/activation/onboard \
  -H "Content-Type: application/json" \
  -H "x-super-admin-key: TU_SUPER_ADMIN_KEY" \
  -d '{
    "tenant_slug": "mi-negocio",
    "tenant_nombre": "Mi Negocio",
    "tipo_negocio": "papeleria",
    "plan": "standard",
    "branding": {
      "empresa": "Mi Negocio",
      "eslogan": "Facturacion sin friccion",
      "color_primario": "#034159",
      "color_secundario": "#02735E"
    }
  }'
```

`tipo_negocio` permitidos:

- `papeleria`
- `carniceria`
- `electronica`
- `generico`

### 3) Verificar token (flujo login)

```bash
curl -X POST http://localhost:4000/api/activation/verify \
  -H "Content-Type: application/json" \
  -d '{ "token": "TOKEN_DEL_CLIENTE" }'
```

Respuesta esperada: `tenant` + `activation` con `branding`, `tipo_negocio`, `plan` y `expires_at`.

---

## Autenticacion y sesion

Sesion en frontend:

- `solanium.token` (activation token)
- `solanium.tenant` (slug, branding, rubro, plan)
- `solanium.user` (si aplica login de usuario)

Reglas actuales:

- Bearer token es el mecanismo principal de autenticacion.
- `x-tenant-slug` se conserva solo por compatibilidad legacy/tests.
- Todas las rutas fuera de `/login` requieren sesion valida en frontend.

---

## Scripts del monorepo

| Comando | Descripcion |
|---|---|
| `npm run db:up` | Levanta servicios de Docker Compose |
| `npm run db:down` | Detiene servicios de Docker Compose |
| `npm run migrate` | Ejecuta migraciones del backend |
| `npm run dev:backend` | Inicia API en modo desarrollo |
| `npm run dev:frontend` | Inicia frontend en modo desarrollo |
| `npm run build:frontend` | Compila frontend para produccion |

Scripts utiles por workspace:

```bash
npm run test:api --workspace @solanium/backend
npm run lint --workspace @solanium/frontend
```

---

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Uso |
|---|---|
| `NODE_ENV` | Entorno de ejecucion |
| `PORT` | Puerto de la API |
| `PGHOST` | Host de PostgreSQL |
| `PGPORT` | Puerto de PostgreSQL |
| `PGUSER` | Usuario de DB |
| `PGPASSWORD` | Password de DB |
| `PGDATABASE` | Nombre de base |
| `PG_POOL_MAX` | Maximo de conexiones |
| `PG_IDLE_TIMEOUT_MS` | Timeout de conexiones inactivas |
| `CORS_ORIGIN` | Origen permitido del frontend |
| `SOLANIUM_SUPER_ADMIN_KEY` | Clave para operaciones de super-admin |

### Frontend (`frontend/.env`)

| Variable | Uso |
|---|---|
| `BACKEND_URL` | URL base del backend |
| `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` | Fallback legacy para tenant en frontend |

---

## Estructura del proyecto

```text
solanium/
|- backend/
|  |- src/
|  |  |- controllers/
|  |  |- services/
|  |  |- repositories/
|  |  |- routes/
|  |  |- middleware/
|  |  |- db/migrations/
|  |  |- app.js
|  |  \- server.js
|- frontend/
|  |- app/
|  |  |- login/
|  |  |- inventario/
|  |  |- facturacion/
|  |  |- clientes/
|  |  \- plantillas/
|  |- components/
|  |- lib/
|  \- tailwind.config.js
|- shared/
|  \- schemas/
|- docker/
|- CLAUDE.md
\- README.md
```

---

## Convenciones tecnicas

- No crear tablas por rubro; usar modelo universal + `metadata` JSONB.
- Toda query de datos de negocio debe aislar por `tenant_id`.
- Si cambia el contrato de datos, actualizar tambien `shared/schemas`.
- Mantener la separacion Controller -> Service -> Repository.
- Priorizar Bearer token en toda integracion nueva.

---

## Contribuir

Revisa primero `CONTRIBUTING.md`.

Checklist minimo antes de abrir PR:

1. Rama corta y descriptiva.
2. Cambios pequenos y enfocados.
3. Migraciones SQL cuando hay cambios de esquema.
4. Sin credenciales ni tokens en commits.
5. Backend y frontend iniciando sin errores.

---

## Licencia

Proyecto bajo licencia ISC.
Consulta `LICENSE` para mas detalles.
