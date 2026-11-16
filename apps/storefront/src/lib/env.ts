export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
export const API_URL_INTERNAL = process.env.API_URL_INTERNAL ?? API_URL;
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const CHECKOUT_DISABLED = process.env.NEXT_PUBLIC_CHECKOUT_DISABLED === "true";
export const STORE_NAME = "Telar Casa Carrillo";

/** Solo servidor: secreto compartido con la API para POST /api/revalidate (sin él la ruta responde 503). */
export const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET ?? "";
