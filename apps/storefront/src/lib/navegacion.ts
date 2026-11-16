/**
 * Navegación del storefront parametrizada en base de datos (tabla StoreRoute del backend).
 * Desde el panel cada ruta se activa o desactiva y se ubica en el menú o en una columna del pie.
 * Este módulo es puro (sin fetch ni React): lo usan el proxy, el layout y los componentes.
 */
import type { Schema } from "@telar/api-client";

export type Ruta = Schema<"StoreRouteResponse">;
export type ColumnaPie = NonNullable<Ruta["footerGroup"]>;

/** Claves que el código conoce. Una ruta nueva en la tienda necesita su fila en la migración. */
export type ClaveRuta =
  | "inicio"
  | "catalogo"
  | "categorias"
  | "artesanos"
  | "carrito"
  | "checkout"
  | "pedido"
  | "cuenta"
  | "cuenta-pedidos"
  | "preguntas-frecuentes"
  | "contacto"
  | "boletin"
  | "paginas";

/**
 * Copia de la semilla de la migración: se usa solo si la API no responde, para que la tienda
 * no quede sin menú ni bloquee nada por un fallo pasajero.
 */
export const RUTAS_POR_DEFECTO: Ruta[] = [
  { key: "inicio", path: "/", label: "Inicio", isEnabled: true, showInHeader: false, footerGroup: null, sortOrder: 0 },
  { key: "catalogo", path: "/productos", label: "Catálogo", isEnabled: true, showInHeader: false, footerGroup: null, sortOrder: 10 },
  { key: "categorias", path: "/categorias", label: "Categorías", isEnabled: true, showInHeader: true, footerGroup: "SHOP", sortOrder: 20 },
  { key: "artesanos", path: "/artesanos", label: "La familia", isEnabled: true, showInHeader: true, footerGroup: "SHOP", sortOrder: 30 },
  { key: "carrito", path: "/carrito", label: "Carrito", isEnabled: true, showInHeader: false, footerGroup: null, sortOrder: 40 },
  { key: "checkout", path: "/checkout", label: "Finalizar compra", isEnabled: true, showInHeader: false, footerGroup: null, sortOrder: 50 },
  { key: "pedido", path: "/pedido", label: "Pedido de invitado", isEnabled: true, showInHeader: false, footerGroup: null, sortOrder: 60 },
  { key: "cuenta", path: "/cuenta", label: "Mi cuenta", isEnabled: true, showInHeader: false, footerGroup: null, sortOrder: 70 },
  { key: "cuenta-pedidos", path: "/cuenta/pedidos", label: "Seguir mi pedido", isEnabled: true, showInHeader: false, footerGroup: "HELP", sortOrder: 80 },
  { key: "preguntas-frecuentes", path: "/preguntas-frecuentes", label: "Preguntas frecuentes", isEnabled: true, showInHeader: false, footerGroup: "HELP", sortOrder: 90 },
  { key: "contacto", path: "/contacto", label: "Contacto", isEnabled: true, showInHeader: false, footerGroup: "HELP", sortOrder: 100 },
  { key: "boletin", path: "/boletin", label: "Boletín", isEnabled: true, showInHeader: false, footerGroup: null, sortOrder: 110 },
  { key: "paginas", path: "/:pagina", label: "Información", isEnabled: true, showInHeader: false, footerGroup: "INFO", sortOrder: 120 },
];

export const TITULOS_PIE: Record<ColumnaPie, string> = { SHOP: "Tienda", HELP: "Ayuda", INFO: "Información" };

const esComodin = (path: string) => path.includes(":");

/** Una ruta cubre su prefijo exacto y todo lo que cuelga de él: "/cuenta" cubre "/cuenta/pedidos/12". */
function cubre(prefijo: string, pathname: string): boolean {
  if (prefijo === "/") return pathname === "/";
  return pathname === prefijo || pathname.startsWith(`${prefijo}/`);
}

/**
 * ¿La URL cae en una ruta desactivada? Basta con que la desactive ella o un ancestro:
 * apagar "/cuenta" apaga también "/cuenta/pedidos". Las rutas con comodín (":pagina")
 * no se resuelven aquí sino en su propia página, porque coincidirían con cualquier URL.
 */
export function rutaBloqueada(pathname: string, rutas: Ruta[]): boolean {
  return rutas.some((r) => !r.isEnabled && !esComodin(r.path) && cubre(r.path, pathname));
}

/** ¿Está activa la ruta con esa clave? Las claves desconocidas se consideran activas. */
export function rutaActiva(rutas: Ruta[], clave: ClaveRuta): boolean {
  const ruta = rutas.find((r) => r.key === clave);
  if (!ruta) return true;
  if (!ruta.isEnabled) return false;
  // Una subruta (cuenta-pedidos) se apaga también si su padre (cuenta) está apagado.
  return esComodin(ruta.path) || !rutaBloqueada(ruta.path, rutas);
}

const ordenar = (rutas: Ruta[]) => [...rutas].sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key));

/** Rutas activas para el menú principal, en orden. */
export function rutasMenu(rutas: Ruta[]): Ruta[] {
  return ordenar(rutas.filter((r) => r.showInHeader && rutaActiva(rutas, r.key as ClaveRuta)));
}

/** Rutas activas de cada columna del pie, en orden; las columnas vacías no aparecen. */
export function rutasPie(rutas: Ruta[]): Array<{ columna: ColumnaPie; rutas: Ruta[] }> {
  return (Object.keys(TITULOS_PIE) as ColumnaPie[])
    .map((columna) => ({
      columna,
      rutas: ordenar(rutas.filter((r) => r.footerGroup === columna && rutaActiva(rutas, r.key as ClaveRuta))),
    }))
    .filter((c) => c.rutas.length > 0);
}
