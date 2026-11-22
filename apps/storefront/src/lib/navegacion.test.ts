import { describe, expect, it } from "vitest";
import { RUTAS_POR_DEFECTO, type Ruta, rutaActiva, rutaBloqueada, rutasMenu, rutasPie } from "./navegacion";

const con = (cambios: Record<string, Partial<Ruta>>): Ruta[] => RUTAS_POR_DEFECTO.map((r) => ({ ...r, ...cambios[r.key] }));

describe("navegación parametrizada", () => {
  it("con todo activo no bloquea nada", () => {
    for (const url of ["/", "/productos/ruana", "/cuenta/pedidos/12", "/terminos-y-condiciones"]) {
      expect(rutaBloqueada(url, RUTAS_POR_DEFECTO)).toBe(false);
    }
  });

  it("una ruta apagada bloquea su prefijo y subrutas, sin tocar rutas parecidas", () => {
    const rutas = con({ contacto: { isEnabled: false }, catalogo: { isEnabled: false } });
    expect(rutaBloqueada("/contacto", rutas)).toBe(true);
    expect(rutaBloqueada("/productos/ruana-azul", rutas)).toBe(true);
    expect(rutaBloqueada("/contactos", rutas)).toBe(false);
    expect(rutaBloqueada("/", rutas)).toBe(false);
  });

  it("apagar un padre apaga sus subrutas y las saca del pie", () => {
    const rutas = con({ cuenta: { isEnabled: false } });
    expect(rutaBloqueada("/cuenta/pedidos", rutas)).toBe(true);
    expect(rutaActiva(rutas, "cuenta-pedidos")).toBe(false);
    const ayuda = rutasPie(rutas).find((c) => c.columna === "HELP");
    expect(ayuda?.rutas.map((r) => r.key)).toEqual(["preguntas-frecuentes", "contacto"]);
  });

  it("la ruta comodín de páginas no bloquea otras URLs", () => {
    const rutas = con({ paginas: { isEnabled: false } });
    expect(rutaBloqueada("/productos", rutas)).toBe(false);
    expect(rutaActiva(rutas, "paginas")).toBe(false);
  });

  it("arma menú y pie en orden y sin columnas vacías", () => {
    const rutas = con({ artesanos: { sortOrder: 1 }, contacto: { showInHeader: true }, categorias: { footerGroup: null } });
    expect(rutasMenu(rutas).map((r) => r.key)).toEqual(["artesanos", "categorias", "visitanos", "contacto"]);
    const pie = rutasPie(con({ categorias: { footerGroup: null }, artesanos: { footerGroup: null }, visitanos: { footerGroup: null } }));
    expect(pie.map((c) => c.columna)).toEqual(["HELP", "INFO"]);
  });
});
