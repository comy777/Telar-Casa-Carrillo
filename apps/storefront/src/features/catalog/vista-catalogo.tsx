import Link from "next/link";
import { EstadoVacio, Icono } from "@telar/ui";
import { flattenCategories, getArtisans, getCategories, getProducts, getTechniques } from "@/lib/catalog";
import { aBusqueda, POR_PAGINA, urlCatalogo, type FiltrosUrl } from "./busqueda";
import { Filtros } from "./filtros";
import { Paginacion } from "./paginacion";
import { ListaPiezas } from "./tarjeta-pieza";

/** Listado con buscador, filtros, orden y paginación. Lo usan /productos y /categorias/[slug]. */
export async function VistaCatalogo({
  base,
  filtros,
  categoriaFija,
}: {
  base: string;
  filtros: FiltrosUrl;
  categoriaFija?: string;
}) {
  const busqueda = aBusqueda(categoriaFija ? { ...filtros, categoria: categoriaFija } : filtros);
  const [resultado, categorias, artesanos, tecnicas] = await Promise.all([
    getProducts(busqueda),
    getCategories(),
    getArtisans({ pageSize: 50 }),
    getTechniques().catch(() => []),
  ]);
  const pagina = busqueda.page ?? 1;
  const desde = resultado.total === 0 ? 0 : (pagina - 1) * POR_PAGINA + 1;
  const hasta = Math.min(pagina * POR_PAGINA, resultado.total);

  return (
    <>
      <form className="buscar buscar-catalogo" role="search" method="get" action={base}>
        <label className="sr" htmlFor="q">
          Buscar piezas
        </label>
        <input id="q" name="q" type="search" placeholder="Buscar: ruana gris, hamaca doble…" defaultValue={filtros.q} maxLength={100} />
        <button type="submit" aria-label="Buscar">
          <Icono nombre="lupa" />
        </button>
      </form>

      <div className="catalogo">
        <Filtros
          filtros={filtros}
          ocultarCategoria={Boolean(categoriaFija)}
          categorias={flattenCategories(categorias).map((c) => ({ valor: c.slug, texto: c.name, nivel: c.depth }))}
          tejedores={artesanos.items.map((a) => ({ valor: a.slug, texto: a.name }))}
          tecnicas={tecnicas.map((t) => ({ valor: t, texto: t }))}
        />

        <section aria-labelledby="t-resultados">
          <h2 className="sr" id="t-resultados">
            Resultados
          </h2>
          <div className="barra-resultados">
            <p className="conteo" aria-live="polite">
              {resultado.total === 0
                ? "Sin resultados"
                : resultado.total === 1
                  ? "1 pieza"
                  : `${desde}–${hasta} de ${resultado.total} piezas`}
              {filtros.q ? (
                <>
                  {" "}
                  para «{filtros.q}» ·{" "}
                  <Link href={urlCatalogo(base, filtros, { q: undefined })}>quitar búsqueda</Link>
                </>
              ) : null}
            </p>
          </div>

          {resultado.items.length === 0 ? (
            <EstadoVacio titulo="No encontramos piezas con esos filtros">
              <p>
                Prueba con otra palabra o <Link href={base}>quita los filtros</Link>.
              </p>
            </EstadoVacio>
          ) : (
            <ListaPiezas piezas={resultado.items} prioridad={4} />
          )}

          <Paginacion base={base} filtros={filtros} pagina={pagina} total={resultado.total} porPagina={POR_PAGINA} />
        </section>
      </div>
    </>
  );
}
