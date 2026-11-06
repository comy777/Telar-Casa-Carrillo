"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";

type CartRaw = Schema<"CartResponse">;
type LineRaw = Schema<"CartLineResponse">;

/** El OpenAPI declara `image` y `reservation` como objetos sin forma; aquí van con su forma real. */
export type CarritoLinea = Omit<LineRaw, "product"> & {
  product:
    | (Omit<NonNullable<LineRaw["product"]>, "image"> & { image: { url: string; altText: string | null } | null })
    | null;
};
export type Carrito = Omit<CartRaw, "lines" | "reservation"> & {
  lines: CarritoLinea[];
  reservation: { expiresAt: string } | null;
};

export const CLAVE_CARRITO = ["carrito"] as const;

interface CarritoValor {
  carrito: Carrito | undefined;
  cargando: boolean;
  abierto: boolean;
  abrir: () => void;
  cerrar: () => void;
  agregar: (variantId: string, cantidad: number) => Promise<void>;
  cambiar: (variantId: string, cantidad: number) => Promise<void>;
  quitar: (variantId: string) => Promise<void>;
  ocupado: boolean;
}

const Contexto = createContext<CarritoValor | null>(null);

export function CarritoProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [abierto, setAbierto] = useState(false);

  const consulta = useQuery({
    queryKey: CLAVE_CARRITO,
    queryFn: async () => (await api.GET("/api/v1/cart")).data as unknown as Carrito,
  });

  const guardar = (c: unknown) => qc.setQueryData(CLAVE_CARRITO, c as Carrito);

  const agregarM = useMutation({
    mutationFn: async ({ variantId, cantidad }: { variantId: string; cantidad: number }) =>
      (await api.POST("/api/v1/cart/items", { body: { variantId, quantity: cantidad as never } })).data,
    onSuccess: guardar,
  });
  const cambiarM = useMutation({
    mutationFn: async ({ variantId, cantidad }: { variantId: string; cantidad: number }) =>
      (await api.PATCH("/api/v1/cart/items/{variantId}", { params: { path: { variantId } }, body: { quantity: cantidad } })).data,
    onSuccess: guardar,
  });
  const quitarM = useMutation({
    mutationFn: async (variantId: string) =>
      (await api.DELETE("/api/v1/cart/items/{variantId}", { params: { path: { variantId } } })).data,
    onSuccess: guardar,
  });

  const valor = useMemo<CarritoValor>(
    () => ({
      carrito: consulta.data,
      cargando: consulta.isPending,
      abierto,
      abrir: () => setAbierto(true),
      cerrar: () => setAbierto(false),
      agregar: async (variantId, cantidad) => {
        await agregarM.mutateAsync({ variantId, cantidad });
        setAbierto(true);
      },
      cambiar: async (variantId, cantidad) => {
        await cambiarM.mutateAsync({ variantId, cantidad });
      },
      quitar: async (variantId) => {
        await quitarM.mutateAsync(variantId);
      },
      ocupado: agregarM.isPending || cambiarM.isPending || quitarM.isPending,
    }),
    [consulta.data, consulta.isPending, abierto, agregarM, cambiarM, quitarM],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useCarrito(): CarritoValor {
  const v = useContext(Contexto);
  if (!v) throw new Error("useCarrito fuera de CarritoProvider");
  return v;
}
