import type { MetadataRoute } from "next";
import { getSitemap } from "@/lib/catalog";
import { SITE_URL } from "@/lib/env";

export const revalidate = 3600;

const PAGINAS_FIJAS = [
  "",
  "/productos",
  "/categorias",
  "/artesanos",
  "/preguntas-frecuentes",
  "/contacto",
  "/envios",
  "/cambios-y-devoluciones",
  "/terminos-y-condiciones",
  "/tratamiento-de-datos",
  "/derecho-de-retracto",
  "/garantias",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const s = await getSitemap().catch(() => ({ products: [], categories: [], artisans: [] }));
  const fecha = (d: string | null) => (d ? new Date(d) : undefined);
  return [
    ...PAGINAS_FIJAS.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const })),
    ...s.categories.map((c) => ({ url: `${SITE_URL}/categorias/${c.slug}`, lastModified: fecha(c.updatedAt) })),
    ...s.products.map((p) => ({ url: `${SITE_URL}/productos/${p.slug}`, lastModified: fecha(p.updatedAt), priority: 0.8 })),
    ...s.artisans.map((a) => ({ url: `${SITE_URL}/artesanos/${a.slug}`, lastModified: fecha(a.updatedAt) })),
  ];
}
