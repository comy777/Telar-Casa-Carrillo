"use client";

import { createContext, useContext, type ReactNode } from "react";
import { CHECKOUT_DISABLED } from "@/lib/env";
import { type ClaveRuta, RUTAS_POR_DEFECTO, type Ruta, rutaActiva } from "@/lib/navegacion";

const Contexto = createContext<Ruta[]>(RUTAS_POR_DEFECTO);

/** Rutas de la tienda (activas e inactivas) para que los componentes cliente oculten enlaces apagados. */
export function NavegacionProvider({ rutas, children }: { rutas: Ruta[]; children: ReactNode }) {
  return <Contexto.Provider value={rutas}>{children}</Contexto.Provider>;
}

export function useRutaActiva(clave: ClaveRuta): boolean {
  return rutaActiva(useContext(Contexto), clave);
}

/** Motivo por el que no se puede comprar, o null si se puede: mantenimiento o carrito apagado en el panel. */
export function useVentaCerrada(): string | null {
  const conCarrito = useRutaActiva("carrito");
  if (CHECKOUT_DISABLED) return "Tienda en mantenimiento";
  if (!conCarrito) return "Compras no disponibles";
  return null;
}
