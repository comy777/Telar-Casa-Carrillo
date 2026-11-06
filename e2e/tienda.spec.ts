import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Falla con violaciones graves o críticas de accesibilidad (WCAG 2.2 AA). */
async function sinViolacionesGraves(page: Page) {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  const graves = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(graves.map((v) => `${v.id}: ${v.nodes.length} nodos — ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
}

test.describe("tienda", () => {
  test("inicio: la pila muestra piezas y la tabla cambia al elegir otra", async ({ page }) => {
    await page.goto("/");
    const tabla = page.locator(".puesto .tabla h1");
    await expect(tabla).not.toBeEmpty();
    const primera = await tabla.textContent();
    const bandas = page.locator(".pila .banda");
    expect(await bandas.count()).toBeGreaterThan(1);
    await bandas.nth(1).click();
    await expect(tabla).not.toHaveText(primera ?? "");
    await expect(page.getByRole("link", { name: /Ver la pieza completa/ })).toBeVisible();
    await sinViolacionesGraves(page);
  });

  test("catálogo: filtra por categoría y pagina con enlaces", async ({ page }) => {
    await page.goto("/productos");
    await expect(page.getByRole("heading", { name: "Todas las piezas" })).toBeVisible();
    await expect(page.locator(".piezas .pieza").first()).toBeVisible();
    await page.goto("/productos?categoria=demo-hamacas");
    const nombres = await page.locator(".piezas .pieza h3").allTextContents();
    expect(nombres.length).toBeGreaterThan(0);
    for (const n of nombres) expect(n.toLowerCase()).toContain("hamaca");
    await sinViolacionesGraves(page);
  });

  test("ficha: agrega al carrito y el carrito lo muestra", async ({ page }) => {
    await page.goto("/productos/demo-ruana-nogal");
    await expect(page.getByRole("heading", { level: 1, name: "Ruana teñida con nogal" })).toBeVisible();
    await sinViolacionesGraves(page);
    await page.getByRole("button", { name: "Agregar al carrito" }).click();
    const panel = page.getByRole("dialog", { name: "Tu carrito" });
    await expect(panel).toBeVisible();
    await expect(panel.getByText("Ruana teñida con nogal")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await page.goto("/carrito");
    await expect(page.getByText("Ruana teñida con nogal")).toBeVisible();
    await expect(page.getByRole("link", { name: "Continuar al pago" })).toBeVisible();
  });

  test("checkout: pide los datos obligatorios antes de crear el pedido", async ({ page }) => {
    await page.goto("/productos/demo-chal-pardo");
    await page.getByRole("button", { name: "Agregar al carrito" }).click();
    await expect(page.getByRole("dialog", { name: "Tu carrito" })).toBeVisible();
    await page.goto("/checkout");
    await expect(page.getByRole("heading", { name: "Finaliza tu compra" })).toBeVisible();
    await expect(page.locator(".totales-tabla .total dd")).toContainText("$");
    await page.getByRole("button", { name: "Confirmar y pagar" }).click();
    await expect(page.getByText("Escribe tu nombre completo")).toBeVisible();
    await expect(page.getByText("Debes aceptar los términos y condiciones")).toBeVisible();
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test("las páginas legales y de ayuda existen aunque falte el texto", async ({ page }) => {
    for (const ruta of ["/tratamiento-de-datos", "/terminos-y-condiciones", "/preguntas-frecuentes", "/contacto"]) {
      const r = await page.goto(ruta);
      expect(r?.status(), ruta).toBe(200);
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("seo: metadatos, sitemap y robots", async ({ page, request }) => {
    await page.goto("/productos/demo-ruana-gris-oveja");
    await expect(page).toHaveTitle(/Ruana de lana gris oveja/);
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(JSON.parse(ld ?? "{}")["@graph"][0]["@type"]).toBe("Product");
    const sitemap = await request.get("/sitemap.xml");
    expect(await sitemap.text()).toContain("/productos/demo-ruana-gris-oveja");
    expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /checkout");
  });

  test("un producto que no existe responde 404 con salida útil", async ({ page }) => {
    const r = await page.goto("/productos/no-existe-esta-pieza");
    expect(r?.status()).toBe(404);
    await expect(page.getByRole("link", { name: "Ver todas las piezas" })).toBeVisible();
  });
});
