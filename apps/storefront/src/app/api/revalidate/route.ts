import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { REVALIDATE_SECRET } from "@/lib/env";

/**
 * La API llama aquí cuando el panel publica cambios, para que la tienda no espere
 * a que venza su caché. Contrato (lado API: StorefrontRevalidator):
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATE_SECRET>
 *   { "tags": ["catalog" | "content" | "navigation", ...] }
 */
const ETIQUETAS = new Set(["catalog", "content", "navigation"]);

export const dynamic = "force-dynamic";

function autorizado(cabecera: string | null): boolean {
  if (!REVALIDATE_SECRET || !cabecera?.startsWith("Bearer ")) return false;
  // Se comparan resúmenes de igual longitud para no filtrar el secreto por tiempos.
  const recibido = createHash("sha256").update(cabecera.slice("Bearer ".length)).digest();
  const esperado = createHash("sha256").update(REVALIDATE_SECRET).digest();
  return timingSafeEqual(recibido, esperado);
}

export async function POST(request: NextRequest) {
  if (!REVALIDATE_SECRET) {
    return NextResponse.json({ error: "Revalidación no configurada" }, { status: 503 });
  }
  if (!autorizado(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let tags: unknown;
  try {
    ({ tags } = (await request.json()) as { tags?: unknown });
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }
  if (!Array.isArray(tags) || tags.length === 0 || !tags.every((t) => typeof t === "string" && ETIQUETAS.has(t))) {
    return NextResponse.json({ error: `tags debe ser una lista de: ${[...ETIQUETAS].join(", ")}` }, { status: 400 });
  }

  // expire: 0 → la próxima visita ya trae datos nuevos (no se sirve la versión vieja).
  for (const tag of new Set(tags as string[])) revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ revalidated: [...new Set(tags)] });
}
