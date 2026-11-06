import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createApiClient, errorMessage, SessionStore, toApiError } from "./index";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/problem+json" } });

afterEach(() => vi.unstubAllGlobals());

describe("ApiError", () => {
  it("usa los mensajes de validación sueltos en lugar del título genérico", async () => {
    const e = await toApiError(json(400, { title: "Solicitud inválida", detail: "La solicitud tiene datos inválidos", errors: ["Debes aceptar el tratamiento de datos"] }));
    expect(e.message).toBe("Debes aceptar el tratamiento de datos");
    expect(e.status).toBe(400);
  });

  it("expone el código estable y los errores por campo", async () => {
    const e = await toApiError(json(422, { code: "INVALID_FIELD", errors: [{ field: "email", message: "Correo inválido" }] }));
    expect(e.code).toBe("INVALID_FIELD");
    expect(e.fieldErrors()).toEqual({ email: "Correo inválido" });
  });

  it("no muestra detalles de errores 5xx al cliente", () => {
    expect(errorMessage(new ApiError(500, { detail: "stack interno" }), "Intenta de nuevo")).toBe("Intenta de nuevo");
    expect(errorMessage(new ApiError(0, {}))).toMatch(/conexión/);
  });
});

describe("SessionStore", () => {
  it("comparte una sola renovación entre llamadas simultáneas", async () => {
    const refresh = vi.fn(async () => "nuevo-token");
    const s = new SessionStore(refresh);
    const [a, b] = await Promise.all([s.refresh(), s.refresh()]);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(a).toBe("nuevo-token");
    expect(b).toBe("nuevo-token");
    expect(s.accessToken).toBe("nuevo-token");
  });

  it("si la renovación falla queda sin sesión y avisa", async () => {
    const s = new SessionStore(async () => {
      throw new Error("sin cookie");
    });
    s.setAccessToken("viejo");
    const aviso = vi.fn();
    s.subscribe(aviso);
    expect(await s.refresh()).toBeNull();
    expect(s.accessToken).toBeNull();
    expect(aviso).toHaveBeenLastCalledWith(null);
  });
});

describe("createApiClient", () => {
  it("envía el token y el token de pedido de invitado en cabeceras, nunca en la URL", async () => {
    const llamadas: Request[] = [];
    vi.stubGlobal("fetch", vi.fn(async (req: Request) => {
      llamadas.push(req);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));
    const s = new SessionStore(async () => null);
    s.setAccessToken("abc");
    s.setGuestOrderToken("token-de-pedido-largo-123");
    const api = createApiClient({ baseUrl: "http://api.test", session: s });
    await api.GET("/api/v1/orders/{orderNumber}", { params: { path: { orderNumber: "TCC-000001" } } });
    const req = llamadas[0]!;
    expect(req.headers.get("Authorization")).toBe("Bearer abc");
    expect(req.headers.get("X-Order-Token")).toBe("token-de-pedido-largo-123");
    expect(req.url).not.toContain("token");
  });

  it("renueva el token una vez ante un 401 y repite la petición con el cuerpo intacto", async () => {
    const cuerpos: string[] = [];
    let intento = 0;
    vi.stubGlobal("fetch", vi.fn(async (req: Request) => {
      cuerpos.push(await req.clone().text());
      intento++;
      if (intento === 1) return json(401, { title: "No autenticado" });
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
    }));
    const s = new SessionStore(async () => "renovado");
    s.setAccessToken("vencido");
    const api = createApiClient({ baseUrl: "http://api.test", session: s });
    await api.POST("/api/v1/cart/items", { body: { variantId: "v1", quantity: 2 as never } });
    expect(intento).toBe(2);
    expect(cuerpos[1]).toBe(cuerpos[0]);
    expect(s.accessToken).toBe("renovado");
  });

  it("lanza ApiError con el problema del backend", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json(409, { title: "Conflicto", detail: "El SKU ya existe", code: "CONFLICT" })));
    const api = createApiClient({ baseUrl: "http://api.test" });
    await expect(api.GET("/api/v1/catalog/categories")).rejects.toMatchObject({ status: 409, message: "El SKU ya existe" });
  });
});
