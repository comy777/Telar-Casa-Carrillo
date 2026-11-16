/**
 * Contenido editable desde el admin (módulo `content` del backend): ajustes de la tienda,
 * banners, testimonios, preguntas frecuentes y páginas. Si el backend aún no responde,
 * cada lectura devuelve un valor vacío y la página muestra su estado vacío; nunca texto inventado.
 */
import { createApiClient } from "@telar/api-client";
import type { Schema } from "@telar/api-client";
import { API_URL_INTERNAL, STORE_NAME } from "./env";
import type { DatosPie } from "@/components/pie";
import { RUTAS_POR_DEFECTO, type Ruta } from "./navegacion";

export type StoreSettings = Schema<"PublicSettingsResponse">;
export type Banner = Schema<"BannerResponse">;
export type Testimonial = Schema<"TestimonialResponse">;
export type Faq = Schema<"FaqResponse">;
export type ContentPage = Schema<"PageResponse">;
export type PageLink = Schema<"PageLinkResponse">;

function api() {
  return createApiClient({ baseUrl: API_URL_INTERNAL, next: { revalidate: 120, tags: ["content"] } });
}

async function seguro<T>(f: () => Promise<T>, vacio: T): Promise<T> {
  try {
    return await f();
  } catch {
    return vacio;
  }
}

export async function getStoreSettings(): Promise<{ settings: StoreSettings | null; storeName: string; footer: DatosPie }> {
  const settings = await seguro(async () => (await api().GET("/api/v1/content/settings")).data ?? null, null);
  return {
    settings,
    // El nombre se edita en el panel; el valor fijo solo cubre una API que aún no responde.
    storeName: settings?.storeName ?? STORE_NAME,
    footer: {
      descripcion: settings?.tagline ?? null,
      ubicacion: settings?.location ?? null,
      correo: settings?.contactEmail ?? null,
      telefono: settings?.contactPhone ?? null,
      whatsapp: settings?.whatsapp ?? null,
      redes: (settings?.socialLinks ?? []).map((r) => ({ nombre: r.name, url: r.url })),
    },
  };
}

export function getBanners(): Promise<Banner[]> {
  return seguro(async () => (await api().GET("/api/v1/content/banners")).data ?? [], []);
}

export function getTestimonials(): Promise<Testimonial[]> {
  return seguro(async () => (await api().GET("/api/v1/content/testimonials")).data ?? [], []);
}

export function getFaqs(): Promise<Faq[]> {
  return seguro(async () => (await api().GET("/api/v1/content/faqs")).data ?? [], []);
}

/** Páginas publicadas desde el panel (políticas, envíos, garantías...), para el pie y el sitemap. */
export function getPages(): Promise<PageLink[]> {
  return seguro(async () => (await api().GET("/api/v1/content/pages")).data ?? [], []);
}

export function getPage(slug: string): Promise<ContentPage | null> {
  return seguro(
    async () => (await api().GET("/api/v1/content/pages/{slug}", { params: { path: { slug } } })).data ?? null,
    null,
  );
}

/**
 * Rutas del storefront y su lugar en el menú y el pie (se editan en el panel).
 * Si la API no responde se usa la semilla: la tienda sigue navegable con su menú de siempre.
 */
export function getNavigation(): Promise<Ruta[]> {
  return seguro(async () => {
    // Misma vigencia que el proxy (30 s), para que menús y bloqueo cambien a la vez.
    const cliente = createApiClient({ baseUrl: API_URL_INTERNAL, next: { revalidate: 30, tags: ["content", "navigation"] } });
    const data = (await cliente.GET("/api/v1/content/navigation")).data;
    return data?.length ? data : RUTAS_POR_DEFECTO;
  }, RUTAS_POR_DEFECTO);
}
