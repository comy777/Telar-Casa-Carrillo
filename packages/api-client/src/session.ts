/**
 * Sesión del navegador según el contrato del backend:
 * - el access token vive solo en memoria (nunca en localStorage);
 * - el refresh token es una cookie HttpOnly que solo ve la API (`/api/v1/auth`);
 * - una sola renovación en vuelo aunque varias peticiones reciban 401 a la vez.
 */
export type SessionListener = (token: string | null) => void;

export class SessionStore {
  private token: string | null = null;
  private listeners = new Set<SessionListener>();
  private refreshing: Promise<string | null> | null = null;
  private orderToken: string | null = null;

  constructor(private readonly refreshFn: () => Promise<string | null>) {}

  get accessToken(): string | null {
    return this.token;
  }

  setAccessToken(token: string | null): void {
    this.token = token;
    for (const l of this.listeners) l(token);
  }

  subscribe(listener: SessionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Renueva el access token con la cookie; comparte la misma promesa entre llamadas simultáneas. */
  refresh(): Promise<string | null> {
    if (!this.refreshing) {
      this.refreshing = this.refreshFn()
        .then((t) => {
          this.setAccessToken(t);
          return t;
        })
        .catch(() => {
          this.setAccessToken(null);
          return null;
        })
        .finally(() => {
          this.refreshing = null;
        });
    }
    return this.refreshing;
  }

  /** Token de invitado para consultar un pedido (viene en el correo); se envía en `X-Order-Token`. */
  get guestOrderToken(): string | null {
    return this.orderToken;
  }

  setGuestOrderToken(token: string | null): void {
    this.orderToken = token;
  }
}
