import type { ProductSearch, Sort } from "@/lib/catalog";

/** Parámetros de la URL del catálogo (en español, compartibles e indexables). */
export interface FiltrosUrl {
  q?: string;
  categoria?: string;
  tejedor?: string;
  tecnica?: string;
  min?: string;
  max?: string;
  disponibles?: string;
  orden?: string;
  pagina?: string;
}

export const ORDENES: Array<{ valor: Sort; texto: string }> = [
  { valor: "newest", texto: "Más recientes" },
  { valor: "best_selling", texto: "Más vendidas" },
  { valor: "price_asc", texto: "Precio: menor a mayor" },
  { valor: "price_desc", texto: "Precio: mayor a menor" },
  { valor: "relevance", texto: "Relevancia" },
];

export const POR_PAGINA = 12;

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const numero = (v: string | undefined) => {
  if (!v) return undefined;
  const n = Number(v.replace(/[^\d]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export function leerFiltros(sp: Record<string, string | string[] | undefined>): FiltrosUrl {
  const f: FiltrosUrl = {};
  for (const k of ["q", "categoria", "tejedor", "tecnica", "min", "max", "disponibles", "orden", "pagina"] as const) {
    const v = uno(sp[k])?.trim();
    if (v) f[k] = v.slice(0, 100);
  }
  return f;
}

export function aBusqueda(f: FiltrosUrl): ProductSearch {
  const orden = ORDENES.find((o) => o.valor === f.orden)?.valor;
  const p = Number(f.pagina);
  const pagina = Number.isInteger(p) && p >= 1 ? Math.min(500, p) : 1;
  return {
    q: f.q,
    category: f.categoria,
    artisan: f.tejedor,
    technique: f.tecnica,
    minPrice: numero(f.min),
    maxPrice: numero(f.max),
    inStock: f.disponibles === "1" ? true : undefined,
    sort: orden ?? (f.q ? "relevance" : "newest"),
    page: pagina,
    pageSize: POR_PAGINA,
  };
}

export function urlCatalogo(base: string, f: FiltrosUrl, cambios: Partial<FiltrosUrl> = {}): string {
  const todo: FiltrosUrl = { ...f, ...cambios };
  // Cambiar cualquier filtro vuelve a la primera página.
  if (!("pagina" in cambios)) delete todo.pagina;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(todo)) if (v) params.set(k, v);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
