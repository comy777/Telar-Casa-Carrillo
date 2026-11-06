"use client";

import { errorMessage, isApiError } from "@telar/api-client";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/**
 * Lleva los errores del backend (problem+json) al formulario: los de campo junto a cada
 * input y el resto como mensaje general. La validación que vale es la del servidor.
 */
export function aplicarErrorApi<T extends FieldValues>(
  e: unknown,
  setError: UseFormSetError<T>,
  campos: Array<Path<T>>,
  fallback?: string,
): string | null {
  if (isApiError(e)) {
    const porCampo = e.fieldErrors();
    let usados = 0;
    for (const campo of campos) {
      const msg = porCampo[campo as string];
      if (msg) {
        setError(campo, { type: "server", message: msg });
        usados++;
      }
    }
    if (usados > 0) return null;
  }
  return errorMessage(e, fallback);
}

/** Lee un token de la URL y lo quita de la barra de direcciones (no queda en el historial). */
export function tomarTokenDeUrl(nombre = "token"): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const token = url.searchParams.get(nombre);
  if (token) {
    url.searchParams.delete(nombre);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }
  return token;
}

export const CONTRASENA_MIN = 10;
