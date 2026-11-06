export { createApiClient, refreshAccessToken, unwrap } from "./client";
export type { ApiClient, ApiClientOptions, ApiPaths } from "./client";
export { ApiError, isApiError, errorMessage, toApiError } from "./errors";
export type { ProblemDetails } from "./errors";
export { SessionStore } from "./session";
export type { components, paths, operations } from "./schema";

import type { components } from "./schema";

/** Atajo para los esquemas del backend: `Schema<"ProductCardResponse">`. */
export type Schema<K extends keyof components["schemas"]> = components["schemas"][K];

/** Formato de pesos colombianos sin decimales: `$ 289.000`. */
export function formatCOP(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return "$ " + Math.round(n).toLocaleString("es-CO");
}
