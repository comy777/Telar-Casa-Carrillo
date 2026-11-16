import type { Metadata, Viewport } from "next";
import { Alfa_Slab_One, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Encabezado } from "@/components/encabezado";
import { Pie } from "@/components/pie";
import { PanelCarrito } from "@/features/cart/panel-carrito";
import { getCategories } from "@/lib/catalog";
import { getNavigation, getPages, getStoreSettings } from "@/lib/content";
import { rutaActiva, rutasMenu, rutasPie } from "@/lib/navegacion";
import { SITE_URL } from "@/lib/env";

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"], variable: "--font-alfa", display: "swap" });
const hanken = Hanken_Grotesk({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-hanken", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { storeName, settings } = await getStoreSettings();
  const description = settings?.tagline ?? undefined;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: description ? `${storeName} · ${description}` : storeName, template: `%s · ${storeName}` },
    description,
    openGraph: { siteName: storeName, locale: "es_CO", type: "website" },
  };
}

export const viewport: Viewport = { themeColor: "#1e5a3c" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categorias, ajustes, paginas, rutas] = await Promise.all([
    getCategories().catch(() => []),
    getStoreSettings(),
    getPages(),
    getNavigation(),
  ]);
  // Menú principal desde el panel: "categorias" se despliega en las primeras cuatro categorías.
  const enlaces = rutasMenu(rutas).flatMap((r) =>
    r.key === "categorias"
      ? categorias.slice(0, 4).map((c) => ({ href: `/categorias/${c.slug}`, texto: c.name }))
      : [{ href: r.path, texto: r.label }],
  );
  const catalogo = rutas.find((r) => r.key === "catalogo");
  // Con menos de dos enlaces (p. ej. aún sin categorías), el catálogo completo encabeza el menú.
  if (enlaces.length < 2 && catalogo && rutaActiva(rutas, "catalogo") && !enlaces.some((e) => e.href === catalogo.path)) {
    enlaces.unshift({ href: catalogo.path, texto: catalogo.label });
  }
  return (
    <html lang="es-CO" className={`${alfa.variable} ${hanken.variable}`}>
      <body>
        <a href="#contenido" className="saltar">
          Saltar al contenido
        </a>
        <Providers rutas={rutas}>
          <Encabezado nombre={ajustes.storeName} enlaces={enlaces} />
          <div id="contenido">{children}</div>
          <Pie nombre={ajustes.storeName} columnas={rutasPie(rutas)} categorias={categorias} paginas={paginas} datos={ajustes.footer} />
          <PanelCarrito />
        </Providers>
      </body>
    </html>
  );
}
