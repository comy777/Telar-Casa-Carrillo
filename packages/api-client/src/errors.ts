/** Error de la API construido a partir de una respuesta `application/problem+json`. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  code?: string;
  /** Errores de validación: mensajes sueltos o, si el backend los asocia, por campo. */
  errors?: Array<string | { field?: string; property?: string; message?: string; messages?: string[] }>;
  [key: string]: unknown;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails;

  constructor(status: number, problem: ProblemDetails) {
    // En errores de validación, los mensajes concretos dicen más que el título genérico.
    const sueltos = (problem.errors ?? []).filter((e): e is string => typeof e === "string");
    super(sueltos.length > 0 ? sueltos.join(". ") : (problem.detail ?? problem.title ?? `Error ${status}`));
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }

  get code(): string | undefined {
    return typeof this.problem.code === "string" ? this.problem.code : undefined;
  }

  /** Mensajes por campo, listos para mostrarlos junto a cada input del formulario. */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const e of this.problem.errors ?? []) {
      if (typeof e === "string") continue;
      const field = e.field ?? e.property;
      const message = e.message ?? e.messages?.[0];
      if (field && message && !out[field]) out[field] = message;
    }
    return out;
  }
}

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/** Mensaje legible para mostrar en pantalla, sin filtrar detalles técnicos. */
export function errorMessage(e: unknown, fallback = "Algo salió mal. Intenta de nuevo."): string {
  if (isApiError(e)) {
    if (e.status === 0) return "No pudimos conectarnos con la tienda. Revisa tu conexión.";
    if (e.status === 429) return "Demasiados intentos. Espera un momento y vuelve a intentarlo.";
    if (e.status >= 500) return fallback;
    return e.message || fallback;
  }
  return fallback;
}

export async function toApiError(res: Response): Promise<ApiError> {
  let problem: ProblemDetails = { status: res.status, title: res.statusText };
  try {
    const body = (await res.clone().json()) as ProblemDetails | { message?: string | string[] };
    if (body && typeof body === "object") {
      if ("message" in body && !("title" in body)) {
        const m = (body as { message?: string | string[] }).message;
        problem = { status: res.status, detail: Array.isArray(m) ? m.join(". ") : m };
      } else {
        problem = { status: res.status, ...(body as ProblemDetails) };
      }
    }
  } catch {
    // cuerpo vacío o no JSON
  }
  return new ApiError(res.status, problem);
}
