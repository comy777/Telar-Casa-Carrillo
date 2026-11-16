import { NextResponse, type NextRequest } from "next/server";
import { API_URL_INTERNAL } from "@/lib/env";
import { rutaBloqueada, type Ruta } from "@/lib/navegacion";

/**
 * Bloquea las rutas desactivadas desde el panel (Contenido → Navegación): responden 404
 * con la página de "no encontrado" de la tienda, igual que una URL que no existe.
 * Las rutas se guardan en memoria unos segundos para no consultar la API en cada petición.
 */
const VIGENCIA_MS = 30_000;
let cache: { rutas: Ruta[]; vence: number } | null = null;

async function rutas(): Promise<Ruta[]> {
  const ahora = Date.now();
  if (cache && cache.vence > ahora) return cache.rutas;
  try {
    const res = await fetch(`${API_URL_INTERNAL}/api/v1/content/navigation`, {
      signal: AbortSignal.timeout(2_000),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    cache = { rutas: (await res.json()) as Ruta[], vence: ahora + VIGENCIA_MS };
  } catch {
    // Si la API no responde no se bloquea nada: mejor una ruta abierta que la tienda caída.
    // Se conserva lo último conocido y se reintenta pronto.
    cache = { rutas: cache?.rutas ?? [], vence: ahora + 5_000 };
  }
  return cache.rutas;
}

export async function proxy(request: NextRequest) {
  if (rutaBloqueada(request.nextUrl.pathname, await rutas())) {
    // "_no-disponible" no es un slug válido: lo atiende [pagina] con notFound() → 404.
    return NextResponse.rewrite(new URL("/_no-disponible", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Solo páginas: sin archivos de Next, imágenes, ni robots/sitemap.
  matcher: ["/((?!_next/|api/|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.[a-zA-Z0-9]+$).*)"],
};
