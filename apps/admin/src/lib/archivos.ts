"use client";

import { toApiError } from "@telar/api-client";
import { API_URL } from "./env";
import { session } from "./api-browser";

/** Envía multipart/form-data (imágenes) con el token de la sesión; renueva una vez si venció. */
export async function enviarFormulario<T>(ruta: string, metodo: "POST" | "PUT", datos: FormData): Promise<T> {
  const intentar = (token: string | null) =>
    fetch(`${API_URL}${ruta}`, {
      method: metodo,
      body: datos,
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  let res = await intentar(session.accessToken);
  if (res.status === 401) res = await intentar(await session.refresh());
  if (!res.ok) throw await toApiError(res);
  return (await res.json()) as T;
}

/** Descarga un CSV autenticado y lo guarda con el nombre indicado. */
export async function descargar(ruta: string, nombre: string): Promise<void> {
  const intentar = (token: string | null) =>
    fetch(`${API_URL}${ruta}`, { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
  let res = await intentar(session.accessToken);
  if (res.status === 401) res = await intentar(await session.refresh());
  if (!res.ok) throw await toApiError(res);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export const TIPOS_IMAGEN = "image/jpeg,image/png,image/webp";
export const MAX_IMAGEN = 5 * 1024 * 1024;

export function validarImagen(f: File): string | null {
  if (!TIPOS_IMAGEN.split(",").includes(f.type)) return "Usa una foto JPEG, PNG o WebP.";
  if (f.size > MAX_IMAGEN) return "La foto pesa más de 5 MB. Redúcela e intenta de nuevo.";
  return null;
}
