import { describe, expect, it } from "vitest";
import { aBusqueda, leerFiltros, urlCatalogo } from "./busqueda";

describe("filtros del catálogo", () => {
  it("traduce la URL en español a la consulta de la API", () => {
    const f = leerFiltros({ q: "ruana", categoria: "ruanas", min: "100.000", disponibles: "1", orden: "price_asc", pagina: "2" });
    expect(aBusqueda(f)).toMatchObject({
      q: "ruana",
      category: "ruanas",
      minPrice: 100000,
      inStock: true,
      sort: "price_asc",
      page: 2,
    });
  });

  it("ordena por relevancia cuando hay búsqueda y por novedad cuando no", () => {
    expect(aBusqueda({ q: "hamaca" }).sort).toBe("relevance");
    expect(aBusqueda({}).sort).toBe("newest");
  });

  it("ignora órdenes desconocidos y páginas absurdas", () => {
    const b = aBusqueda({ orden: "DROP TABLE", pagina: "-9" });
    expect(b.sort).toBe("newest");
    expect(b.page).toBe(1);
  });

  it("cambiar un filtro vuelve a la primera página", () => {
    expect(urlCatalogo("/productos", { q: "ruana", pagina: "3" }, { categoria: "hamacas" })).toBe("/productos?q=ruana&categoria=hamacas");
    expect(urlCatalogo("/productos", { q: "ruana" }, { pagina: "2" })).toBe("/productos?q=ruana&pagina=2");
  });
});
