import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./schema";
import { toApiError, ApiError } from "./errors";
import { SessionStore } from "./session";

export type ApiPaths = paths;

export interface ApiClientOptions {
  /** Origen de la API, p. ej. `http://localhost:3001`. Las rutas ya incluyen `/api/v1`. */
  baseUrl: string;
  /** `include` en el navegador para enviar las cookies de carrito y refresh. */
  credentials?: RequestCredentials;
  /** Cabeceras fijas (p. ej. en el servidor de Next). */
  headers?: Record<string, string>;
  /** Opciones de caché de Next para lecturas públicas en el servidor. */
  next?: { revalidate?: number | false; tags?: string[] };
  /** Si se omite, no se adjunta token ni se intenta renovar (lecturas públicas). */
  session?: SessionStore;
}

const REFRESH_PATH = "/api/v1/auth/refresh";

export function createApiClient(opts: ApiClientOptions) {
  const client = createClient<paths>({
    baseUrl: opts.baseUrl.replace(/\/$/, ""),
    credentials: opts.credentials ?? "same-origin",
    headers: opts.headers,
    // Next.js extiende fetch con `next`; fuera de Next se ignora.
    fetch: (req: Request) => fetch(req, opts.next ? ({ next: opts.next } as RequestInit) : undefined),
  });

  // Copia intacta de cada petición autenticada: el cuerpo de la original ya se consumió al enviarla.
  const copies = new WeakMap<Request, Request>();

  const auth: Middleware = {
    async onRequest({ request }) {
      const token = opts.session?.accessToken;
      if (token && !request.headers.has("Authorization")) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
      const orderToken = opts.session?.guestOrderToken;
      if (orderToken && !request.headers.has("X-Order-Token")) {
        request.headers.set("X-Order-Token", orderToken);
      }
      if (opts.session) copies.set(request, request.clone());
      return request;
    },
    async onResponse({ request, response }) {
      const copy = copies.get(request);
      if (
        response.status === 401 &&
        opts.session &&
        copy &&
        !new URL(request.url).pathname.startsWith("/api/v1/auth/")
      ) {
        const token = await opts.session.refresh();
        if (token) {
          copy.headers.set("Authorization", `Bearer ${token}`);
          const res = await fetch(copy);
          if (res.ok) return res;
          throw await toApiError(res);
        }
      }
      if (!response.ok) throw await toApiError(response);
      return response;
    },
    onError({ error }) {
      if (error instanceof ApiError) return error;
      return new ApiError(0, { title: "Network error", detail: String(error) });
    },
  };

  client.use(auth);
  return client;
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** Pide un access token nuevo usando la cookie HttpOnly. Devuelve null si no hay sesión. */
export async function refreshAccessToken(baseUrl: string): Promise<string | null> {
  const res = await fetch(baseUrl.replace(/\/$/, "") + REFRESH_PATH, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { accessToken?: string };
  return body.accessToken ?? null;
}

/**
 * openapi-fetch devuelve `{ data, error }`; como el middleware lanza ApiError en cualquier
 * respuesta no exitosa, `data` siempre está presente cuando la promesa se resuelve.
 */
export async function unwrap<T>(p: Promise<{ data?: T; error?: unknown; response: Response }>): Promise<T> {
  const { data, response } = await p;
  if (response.status === 204) return undefined as T;
  return data as T;
}
