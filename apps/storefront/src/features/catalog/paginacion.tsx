import Link from "next/link";
import { Icono } from "@telar/ui";
import { urlCatalogo, type FiltrosUrl } from "./busqueda";

/** Paginación con enlaces reales (indexables): 1 … 4 5 6 … 12. */
export function Paginacion({ base, filtros, pagina, total, porPagina }: {
  base: string;
  filtros: FiltrosUrl;
  pagina: number;
  total: number;
  porPagina: number;
}) {
  const paginas = Math.ceil(total / porPagina);
  if (paginas <= 1) return null;
  const visibles = new Set([1, paginas, pagina - 1, pagina, pagina + 1].filter((p) => p >= 1 && p <= paginas));
  const lista = [...visibles].sort((a, b) => a - b);
  const href = (p: number) => urlCatalogo(base, filtros, { pagina: p > 1 ? String(p) : undefined });

  return (
    <nav aria-label="Páginas del catálogo">
      <ul className="paginacion">
        {pagina > 1 ? (
          <li>
            <Link href={href(pagina - 1)} aria-label="Página anterior" rel="prev">
              <Icono nombre="chevron-izq" />
            </Link>
          </li>
        ) : null}
        {lista.map((p, i) => (
          <li key={p} className="paginacion-item">
            {i > 0 && p - lista[i - 1]! > 1 ? <span className="paginacion-salto" aria-hidden="true">…</span> : null}
            <Link href={href(p)} aria-current={p === pagina ? "page" : undefined} aria-label={`Página ${p}`}>
              {p}
            </Link>
          </li>
        ))}
        {pagina < paginas ? (
          <li>
            <Link href={href(pagina + 1)} aria-label="Página siguiente" rel="next">
              <Icono nombre="chevron-der" />
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
