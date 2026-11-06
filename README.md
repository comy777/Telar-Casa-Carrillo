# Telar Casa Carrillo — Tienda y panel

Frontend de la tienda en línea de Telar Casa Carrillo, un taller familiar que teje ruanas, prendas y hamacas en telar.
Todo el contenido (catálogo, precios, fotos, clientes, pedidos, banners, textos) viene de la API del repositorio
[`Telar-Casa-Carrillo-Backend`](https://github.com/comy777/Telar-Casa-Carrillo-Backend); aquí no hay datos de negocio escritos en el código.

| App | Puerto | Qué es |
|---|---|---|
| `apps/storefront` | 3000 | Tienda pública: inicio, catálogo, fichas, artesanos, carrito, checkout con Wompi, cuenta del cliente, contenido |
| `apps/admin` | 3002 | Panel privado: catálogo, inventario, pedidos, pagos y reembolsos, envíos, cupones, clientes, contenido, métricas, reportes |
| `packages/ui` | — | Tokens del mundo «Plaza de Nobsa» (Tailwind v4 `@theme`), componentes y estilos compartidos |
| `packages/api-client` | — | Tipos generados del OpenAPI del backend, cliente con sesión en memoria, errores `problem+json` |

Decisiones y fases: [`docs/frontend-plan.md`](docs/frontend-plan.md). Producto: [`PRODUCT.md`](PRODUCT.md). Diseño: [`DESIGN.md`](DESIGN.md).
`prototype/` es el prototipo HTML aprobado de la dirección visual (referencia, no se despliega).

## Puesta en marcha

Requisitos: Node 22+, y la API del backend corriendo (`npm run start:dev` en el otro repositorio, con `npm run db:seed:demo` para tener piezas de ejemplo).

```bash
npm install
```

```bash
cp apps/storefront/.env.example apps/storefront/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

```bash
npm run dev:tienda
```

```bash
npm run dev:admin
```

Para entrar al panel, una cuenta registrada y confirmada necesita un rol con permisos: en el backend,
`npm run admin:grant -- correo@ejemplo.com admin`.

## Contrato con la API

Los tipos salen del OpenAPI del backend. Después de cambiar la API:

```bash
npm run api:generate
```

`npm run api:check` falla si `packages/api-client/src/schema.d.ts` no coincide con la API publicada (`API_DOCS_URL`).

## Calidad

| Comando | Qué revisa |
|---|---|
| `npm run lint` | ESLint de Next + límites entre capas (`packages/ui` no conoce la API ni Next) |
| `npm run typecheck` | TypeScript estricto en apps y paquetes |
| `npm test` | Vitest: cliente de la API, sesión, componentes, filtros del catálogo, markdown seguro |
| `npm run e2e` | Playwright en escritorio y celular contra la tienda local (usa Edge instalado; `PW_CHANNEL=chrome` para Chrome) con revisión de accesibilidad (axe, WCAG 2.2 AA) |
| `npm run build` | Build de producción (necesita la API: prerenderiza el catálogo) |

## Seguridad y sesión

- El access token vive solo en memoria; el refresh token es una cookie HttpOnly de la API (`/api/v1/auth`). Al cargar, la app renueva la sesión con esa cookie.
- El token de los pedidos de invitado (enlace del correo) se pasa a la cabecera `X-Order-Token` y se borra de la URL.
- Las rutas privadas se protegen en el navegador, pero la autorización real la hace el backend en cada llamada.
- Cabeceras: CSP (con Wompi y Cloudinary), `nosniff`, `Referrer-Policy`, `Permissions-Policy`; el panel además `X-Robots-Tag: noindex`.

## Despliegue

Las dos apps y la API deben estar en el **mismo sitio** para que las cookies `SameSite` funcionen, por ejemplo
`telarcasacarrillo.com` (tienda), `admin.telarcasacarrillo.com` (panel) y `api.telarcasacarrillo.com` (API).
En el backend: `STOREFRONT_URL`, `ADMIN_URL` y `CORS_ORIGINS` con esos orígenes.

Variables de la tienda: `NEXT_PUBLIC_API_URL`, `API_URL_INTERNAL` (opcional, red interna), `NEXT_PUBLIC_SITE_URL`,
`NEXT_PUBLIC_CHECKOUT_DISABLED` (mantenimiento). Del panel: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STOREFRONT_URL`.
