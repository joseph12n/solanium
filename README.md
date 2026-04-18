# Solanium

Solanium es un monorepo para un sistema de facturación multitenant orientado a distintos rubros de negocio. La base del modelo usa `tenants` y metadatos dinámicos en `JSONB`, con validación compartida mediante `Zod`.

## Qué incluye

- Backend en Node.js + Express con arquitectura Controller → Service → Repository.
- Frontend en Next.js 14 con App Router, Tailwind y Framer Motion.
- Base de datos PostgreSQL 16 levantada por Docker.
- Schemas compartidos en `shared/schemas` para validar metadatos por tipo de negocio.

## Requisitos

- Node.js 18 o superior.
- npm 9 o superior.
- Docker y Docker Compose.

## Inicio rápido

```bash
npm install
npm run db:up

copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env

npm run migrate
npm run dev:backend
npm run dev:frontend
```

En Windows PowerShell, si prefieres `Copy-Item`:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
```

Abre `http://localhost:3000/inventario`.

## Variables de entorno

### Backend

El archivo de referencia es `backend/.env.example`.

- `NODE_ENV`: entorno de ejecución.
- `PORT`: puerto del backend, por defecto `4000`.
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`: conexión a PostgreSQL.
- `PG_POOL_MAX`, `PG_IDLE_TIMEOUT_MS`: configuración del pool.
- `CORS_ORIGIN`: origen permitido para el frontend.

### Frontend

El archivo de referencia es `frontend/.env.example`.

- `BACKEND_URL`: URL del backend.
- `NEXT_PUBLIC_DEFAULT_TENANT_SLUG`: tenant inicial.

## Scripts disponibles

Desde la raíz del monorepo:

- `npm run db:up`: levanta la base de datos con Docker.
- `npm run db:down`: apaga la base de datos.
- `npm run migrate`: ejecuta migraciones del backend.
- `npm run dev:backend`: ejecuta el backend en modo desarrollo.
- `npm run dev:frontend`: ejecuta el frontend en modo desarrollo.
- `npm run build:frontend`: compila el frontend para producción.

## Estructura del proyecto

```text
backend/   API Express, migraciones, repositorios, servicios y controladores
frontend/  App web en Next.js
shared/    Schemas y validaciones compartidas
docker/    Recursos de infraestructura local
```

## Arquitectura y reglas

- Todas las entidades que admiten variación por rubro deben usar `metadata JSONB`.
- No se crean tablas separadas por tipo de negocio.
- Toda consulta sobre datos multitenant debe filtrar por `tenant_id`.
- Las operaciones que modifican ventas o stock deben ejecutarse dentro de transacciones.
- Las validaciones compartidas deben vivir en `shared/schemas`.

## Flujo de trabajo recomendado

1. Levantar PostgreSQL con Docker.
2. Configurar `.env` en backend y frontend.
3. Ejecutar migraciones.
4. Desarrollar primero la API y luego la UI.
5. Revisar que los cambios respeten el contexto del tenant activo.

## Contribuir

Lee primero `CONTRIBUTING.md`. En resumen:

- Haz cambios pequeños y coherentes con la estructura actual.
- No comitees secretos ni archivos de entorno.
- Mantén sincronizados backend, frontend y schemas compartidos cuando cambie un contrato.
- Verifica al menos que el frontend compile antes de abrir un PR.

## Licencia

Este proyecto está publicado bajo licencia ISC. Revisa el archivo `LICENSE` para el texto completo.
