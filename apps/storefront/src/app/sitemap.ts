import type { MetadataRoute } from "next";
import { getSitemap } from "@/lib/catalog";
import { getNavigation, getPages } from "@/lib/content";
import { rutaActiva, rutaBloqueada } from "@/lib/navegacion";
import { SITE_URL } from "@/lib/env";

export const revalidate = 3600;

const PAGINAS_FIJAS = [
  "",
  "/productos",
  "/categorias",
  "/artesanos",
  "/preguntas-frecuentes",
  "/contacto",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [s, paginas, rutas] = await Promise.all([
    getSitemap().catch(() => ({ products: [], categories: [], artisans: [] })),
    getPages(),
    getNavigation(),
  ]);
  const fecha = (d: string | null) => (d ? new Date(d) : undefined);
  const conPaginas = rutaActiva(rutas, "paginas");
  // Sin las rutas desactivadas en el panel.
  return [
    ...PAGINAS_FIJAS.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const })),
    ...(conPaginas ? paginas : []).map((p) => ({ url: `${SITE_URL}/${p.slug}`, lastModified: new Date(p.updatedAt) })),
    ...s.categories.map((c) => ({ url: `${SITE_URL}/categorias/${c.slug}`, lastModified: fecha(c.updatedAt) })),
    ...s.products.map((p) => ({ url: `${SITE_URL}/productos/${p.slug}`, lastModified: fecha(p.updatedAt), priority: 0.8 })),
    ...s.artisans.map((a) => ({ url: `${SITE_URL}/artesanos/${a.slug}`, lastModified: fecha(a.updatedAt) })),
  ].filter((e) => !rutaBloqueada(new URL(e.url).pathname, rutas));
}
