/**
 * El lugar (módulo `venue` del backend): textos, horarios, ubicación y actividades, editables
 * desde el panel. Si la API no responde, la vista muestra lo que tenga y el formulario sigue.
 */
import { createApiClient } from "@telar/api-client";
import type { Schema } from "@telar/api-client";
import { API_URL_INTERNAL } from "./env";

export type Lugar = Schema<"VenuePageResponse">;
export type Actividad = Schema<"VenueActivityResponse">;
export type TipoCotizacion = Schema<"CreateQuoteDto">["kind"];

const VACIO: Lugar = {
  settings: { title: null, intro: null, schedule: null, address: null, mapUrl: null, quoteNote: null },
  activities: [],
};

export async function getLugar(): Promise<Lugar> {
  try {
    const api = createApiClient({ baseUrl: API_URL_INTERNAL, next: { revalidate: 120, tags: ["content"] } });
    return (await api.GET("/api/v1/venue")).data ?? VACIO;
  } catch {
    return VACIO;
  }
}
