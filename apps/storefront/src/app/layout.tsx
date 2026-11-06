import type { Metadata, Viewport } from "next";
import { Alfa_Slab_One, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Encabezado } from "@/components/encabezado";
import { Pie } from "@/components/pie";
import { PanelCarrito } from "@/features/cart/panel-carrito";
import { getCategories } from "@/lib/catalog";
import { getStoreSettings } from "@/lib/content";
import { SITE_URL, STORE_NAME } from "@/lib/env";

const alfa = Alfa_Slab_One({ weight: "400", subsets: ["latin"], variable: "--font-alfa", display: "swap" });
const hanken = Hanken_Grotesk({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-hanken", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${STORE_NAME} · Ruanas y hamacas tejidas en telar`, template: `%s · ${STORE_NAME}` },
  description: "Ruanas, prendas y hamacas tejidas en telar por la familia Carrillo. Envíos a toda Colombia.",
  openGraph: { siteName: STORE_NAME, locale: "es_CO", type: "website" },
};

export const viewport: Viewport = { themeColor: "#1e5a3c" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [categorias, ajustes] = await Promise.all([getCategories().catch(() => []), getStoreSettings()]);
  const enlaces = [
    ...categorias.slice(0, 4).map((c) => ({ href: `/categorias/${c.slug}`, texto: c.name })),
    { href: "/artesanos", texto: "La familia" },
  ];
  return (
    <html lang="es-CO" className={`${alfa.variable} ${hanken.variable}`}>
      <body>
        <a href="#contenido" className="saltar">
          Saltar al contenido
        </a>
        <Providers>
          <Encabezado enlaces={enlaces.length > 1 ? enlaces : [{ href: "/productos", texto: "Catálogo" }, ...enlaces]} />
          <div id="contenido">{children}</div>
          <Pie categorias={categorias} datos={ajustes.footer} />
          <PanelCarrito />
        </Providers>
      </body>
    </html>
  );
}
