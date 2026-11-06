/**
 * Contenido editable desde el admin (módulo `content` del backend): ajustes de la tienda,
 * banners, testimonios, preguntas frecuentes y páginas. Si el backend aún no responde,
 * cada lectura devuelve un valor vacío y la página muestra su estado vacío; nunca texto inventado.
 */
import { createApiClient } from "@telar/api-client";
import type { Schema } from "@telar/api-client";
import { API_URL_INTERNAL } from "./env";
import type { DatosPie } from "@/components/pie";

export type StoreSettings = Schema<"PublicSettingsResponse">;
export type Banner = Schema<"BannerResponse">;
export type Testimonial = Schema<"TestimonialResponse">;
export type Faq = Schema<"FaqResponse">;
export type ContentPage = Schema<"PageResponse">;

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

export async function getStoreSettings(): Promise<{ settings: StoreSettings | null; footer: DatosPie }> {
  const settings = await seguro(async () => (await api().GET("/api/v1/content/settings")).data ?? null, null);
  return {
    settings,
    footer: {
      descripcion: settings?.tagline ?? null,
      ubicacion: settings?.location ?? null,
      correo: settings?.contactEmail ?? null,
      telefono: settings?.contactPhone ?? null,
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

export function getPage(slug: string): Promise<ContentPage | null> {
  return seguro(
    async () => (await api().GET("/api/v1/content/pages/{slug}", { params: { path: { slug } } })).data ?? null,
    null,
  );
}
