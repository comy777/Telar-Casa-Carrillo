"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Schema } from "@telar/api-client";
import { api, session } from "@/lib/api-browser";

export type Usuario = Schema<"MeResponse">;
type Estado = "cargando" | "invitado" | "conectado";

interface SesionValor {
  estado: Estado;
  usuario: Usuario | null;
  ingresar: (email: string, password: string) => Promise<Usuario>;
  salir: () => Promise<void>;
  recargar: () => Promise<void>;
}

const SesionContexto = createContext<SesionValor | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const qc = useQueryClient();

  const cargarUsuario = useCallback(async () => {
    if (!session.accessToken) {
      setUsuario(null);
      setEstado("invitado");
      return;
    }
    try {
      const { data } = await api.GET("/api/v1/auth/me");
      setUsuario(data ?? null);
      setEstado(data ? "conectado" : "invitado");
    } catch {
      setUsuario(null);
      setEstado("invitado");
    }
  }, []);

  // Al cargar la página: renovar con la cookie HttpOnly (si existe) y leer el usuario.
  useEffect(() => {
    let vivo = true;
    void session.refresh().then(() => {
      if (vivo) void cargarUsuario();
    });
    const quitar = session.subscribe((t) => {
      if (!t && vivo) {
        setUsuario(null);
        setEstado("invitado");
      }
    });
    return () => {
      vivo = false;
      quitar();
    };
  }, [cargarUsuario]);

  const ingresar = useCallback(
    async (email: string, password: string) => {
      const { data } = await api.POST("/api/v1/auth/login", { body: { email, password } });
      if (!data) throw new Error("Respuesta vacía");
      session.setAccessToken(data.accessToken);
      setUsuario(data.user);
      setEstado("conectado");
      // El carrito de invitado se une al de la cuenta en el servidor: volver a leerlo.
      await qc.invalidateQueries();
      return data.user;
    },
    [qc],
  );

  const salir = useCallback(async () => {
    try {
      await api.POST("/api/v1/auth/logout");
    } finally {
      session.setAccessToken(null);
      setUsuario(null);
      setEstado("invitado");
      qc.clear();
    }
  }, [qc]);

  const valor = useMemo(
    () => ({ estado, usuario, ingresar, salir, recargar: cargarUsuario }),
    [estado, usuario, ingresar, salir, cargarUsuario],
  );
  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}

export function useSesion(): SesionValor {
  const v = useContext(SesionContexto);
  if (!v) throw new Error("useSesion fuera de SesionProvider");
  return v;
}
