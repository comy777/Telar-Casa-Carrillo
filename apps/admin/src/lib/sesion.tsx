"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Schema } from "@telar/api-client";
import { api, session } from "./api-browser";

export type Usuario = Schema<"MeResponse">;
type Estado = "cargando" | "invitado" | "conectado";

interface Valor {
  estado: Estado;
  usuario: Usuario | null;
  puede: (permiso: string) => boolean;
  ingresar: (email: string, password: string) => Promise<Usuario>;
  salir: () => Promise<void>;
}

const Contexto = createContext<Valor | null>(null);

export function SesionAdmin({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const qc = useQueryClient();

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const token = await session.refresh();
      if (!vivo) return;
      if (!token) return setEstado("invitado");
      try {
        const { data } = await api.GET("/api/v1/auth/me");
        if (!vivo) return;
        setUsuario(data ?? null);
        setEstado(data ? "conectado" : "invitado");
      } catch {
        if (vivo) setEstado("invitado");
      }
    })();
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
  }, []);

  const ingresar = useCallback(async (email: string, password: string) => {
    const { data } = await api.POST("/api/v1/auth/login", { body: { email, password } });
    if (!data) throw new Error("Respuesta vacía");
    session.setAccessToken(data.accessToken);
    setUsuario(data.user);
    setEstado("conectado");
    return data.user;
  }, []);

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

  const valor = useMemo<Valor>(
    () => ({
      estado,
      usuario,
      puede: (p) => Boolean(usuario?.permissions.includes(p)),
      ingresar,
      salir,
    }),
    [estado, usuario, ingresar, salir],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion(): Valor {
  const v = useContext(Contexto);
  if (!v) throw new Error("useSesion fuera de SesionAdmin");
  return v;
}
