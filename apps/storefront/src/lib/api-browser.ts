"use client";

import { createApiClient, refreshAccessToken, SessionStore } from "@telar/api-client";
import { API_URL } from "./env";

/** Sesión y cliente del navegador: uno por pestaña. */
export const session = new SessionStore(() => refreshAccessToken(API_URL));

export const api = createApiClient({
  baseUrl: API_URL,
  credentials: "include",
  session,
});
