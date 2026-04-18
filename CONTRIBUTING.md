# Contributing to Solanium

Gracias por contribuir. Este proyecto busca mantener una base simple, predecible y fácil de extender para escenarios multitenant.

## Antes de empezar

- Lee el `README.md` para entender la arquitectura general.
- Revisa `backend/.env.example` y `frontend/.env.example` antes de ejecutar el proyecto.
- Evita introducir cambios que rompan el contrato entre `backend`, `frontend` y `shared`.

## Flujo recomendado

1. Crea una rama pequeña y descriptiva.
2. Implementa el cambio en la capa correcta.
3. Si cambias validaciones o estructuras de datos, actualiza `shared/schemas`.
4. Ejecuta los scripts relevantes.
5. Abre el PR con una descripción clara del impacto.

## Convenciones del código

- Backend: Controller → Service → Repository.
- Mantén las consultas con filtro por `tenant_id` cuando aplique.
- Prefiere validaciones compartidas en `shared/schemas` antes de duplicarlas.
- No agregues lógica de negocio en el frontend que ya pertenezca al backend.
- Mantén los nombres consistentes entre API, formularios y schemas.

## Revisión mínima antes de enviar

- `npm run migrate` si tocaste base de datos o migraciones.
- `npm run dev:backend` para validar que la API arranca.
- `npm run dev:frontend` para validar que la app compila y carga.
- `npm run build:frontend` cuando el cambio afecte la interfaz o el enrutado.

## Secretos y archivos locales

- No subas archivos `.env`.
- No subas credenciales, llaves privadas ni archivos locales del editor.
- Si necesitas documentar una variable, usa el archivo `.env.example` correspondiente.

## Buenas prácticas para PRs

- Mantén el PR enfocado en un solo objetivo.
- Explica qué cambió, por qué cambió y cómo validarlo.
- Si el cambio altera el contrato de datos, incluye notas para backend y frontend.

## Licencia

Al contribuir aceptas que tus aportes se publiquen bajo la licencia ISC del proyecto.