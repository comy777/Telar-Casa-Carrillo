"use client";

import { useState } from "react";
import { Boton } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { CHECKOUT_DISABLED } from "@/lib/env";
import { useCarrito } from "./cart-context";

/** Agrega la única variante de una pieza (las piezas con varias variantes se eligen en su ficha). */
export function BotonAgregarRapido({ slug, agotada }: { slug: string; agotada: boolean }) {
  const { agregar } = useCarrito();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (agotada) {
    return (
      <Boton variante="accion" disabled>
        Agotada
      </Boton>
    );
  }
  if (CHECKOUT_DISABLED) {
    return (
      <Boton variante="accion" disabled>
        Tienda en mantenimiento
      </Boton>
    );
  }

  return (
    <>
      <Boton
        variante="accion"
        cargando={cargando}
        onClick={async () => {
          setCargando(true);
          setError(null);
          try {
            const { data } = await api.GET("/api/v1/catalog/products/{slug}", { params: { path: { slug } } });
            const variante = data?.variants.find((v) => v.availability !== "OUT_OF_STOCK");
            if (!variante) throw new Error("agotada");
            await agregar(variante.id, 1);
          } catch (e) {
            setError(errorMessage(e, "No pudimos agregarla. Intenta de nuevo."));
          } finally {
            setCargando(false);
          }
        }}
      >
        Agregar al carrito
      </Boton>
      {error ? (
        <span className="campo-error" role="alert">
          {error}
        </span>
      ) : null}
    </>
  );
}
