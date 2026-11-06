/**
 * Lecturas públicas del catálogo, hechas en el servidor de Next con ISR.
 * Única puerta a /catalog/* para las páginas: si la API cambia, cambia aquí.
 */
import { createApiClient, isApiError, type Schema } from "@telar/api-client";
import { API_URL_INTERNAL } from "./env";

export type ProductCard = Schema<"ProductCardResponse">;
export type ProductPage = Schema<"ProductCardPage">;
export type ProductDetail = Schema<"ProductDetailResponse">;
export type CategoryNode = Schema<"CategoryTreeResponse">;
export type CategoryPage = Schema<"CategoryPageResponse">;
export type Artisan = Schema<"PublicArtisanResponse">;
export type Sort = "newest" | "price_asc" | "price_desc" | "relevance" | "best_selling";

const REVALIDATE = 60;

function api(tags: string[] = ["catalog"]) {
  return createApiClient({ baseUrl: API_URL_INTERNAL, next: { revalidate: REVALIDATE, tags } });
}

/** Devuelve null en 404 para que la página llame a notFound(). */
async function orNull<T>(p: Promise<{ data?: T }>): Promise<T | null> {
  try {
    const { data } = await p;
    return data ?? null;
  } catch (e) {
    if (isApiError(e) && e.status === 404) return null;
    throw e;
  }
}

export interface ProductSearch {
  q?: string | undefined;
  category?: string | undefined;
  artisan?: string | undefined;
  material?: string | undefined;
  technique?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  featured?: boolean | undefined;
  inStock?: boolean | undefined;
  sort?: Sort | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export async function getProducts(search: ProductSearch = {}): Promise<ProductPage> {
  const { page, pageSize, ...rest } = search;
  const query = Object.fromEntries(
    Object.entries({ ...rest, page, pageSize }).filter(([, v]) => v !== undefined && v !== ""),
  );
  const { data } = await api().GET("/api/v1/catalog/products", {
    // `page` y `pageSize` se documentan como Object en el OpenAPI; son números.
    params: { query: query as never },
  });
  return data ?? { items: [], total: 0, page: 1, pageSize: 24 };
}

export function getProduct(slug: string): Promise<ProductDetail | null> {
  return orNull(api(["catalog", `product:${slug}`]).GET("/api/v1/catalog/products/{slug}", { params: { path: { slug } } }));
}

export async function getCategories(): Promise<CategoryNode[]> {
  const { data } = await api().GET("/api/v1/catalog/categories");
  return data ?? [];
}

export function getCategory(slug: string): Promise<CategoryPage | null> {
  return orNull(api().GET("/api/v1/catalog/categories/{slug}", { params: { path: { slug } } }));
}

export async function getArtisans(query: { featured?: boolean; page?: number; pageSize?: number } = {}) {
  const { data } = await api().GET("/api/v1/catalog/artisans", { params: { query: query as never } });
  return data ?? { items: [] as Artisan[], total: 0, page: 1, pageSize: 24 };
}

export function getArtisan(slug: string): Promise<Artisan | null> {
  return orNull(api().GET("/api/v1/catalog/artisans/{slug}", { params: { path: { slug } } }));
}

export async function getMaterials(): Promise<string[]> {
  const { data } = await api().GET("/api/v1/catalog/materials");
  const list = (data ?? []) as unknown as Array<string | { name: string }>;
  return list.map((m) => (typeof m === "string" ? m : m.name));
}

export async function getTechniques(): Promise<string[]> {
  const { data } = await api().GET("/api/v1/catalog/techniques");
  return data ?? [];
}

export async function getRelated(slug: string): Promise<ProductCard[]> {
  try {
    const { data } = await api([`product:${slug}`]).GET("/api/v1/catalog/products/{slug}/related", {
      params: { path: { slug } },
    });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getSitemap() {
  const { data } = await api().GET("/api/v1/catalog/sitemap");
  return data ?? { products: [], categories: [], artisans: [] };
}

/** Aplana el árbol de categorías (para filtros y navegación). */
export function flattenCategories(nodes: CategoryNode[], depth = 0): Array<CategoryNode & { depth: number }> {
  return nodes.flatMap((n) => [{ ...n, depth }, ...flattenCategories(n.children, depth + 1)]);
}
