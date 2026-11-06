"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { Cantidad, EstadoVacio, Icono, claseBoton, formatoPesos } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { useCarrito, type CarritoLinea } from "./cart-context";
import { useState } from "react";

const PROBLEMAS: Record<string, string> = {
  UNAVAILABLE: "Esta pieza ya no está a la venta.",
  OUT_OF_STOCK: "Se agotó.",
  INSUFFICIENT_STOCK: "No hay tantas unidades.",
};

export function textoProblema(l: CarritoLinea): string | null {
  const p = l.issues[0];
  if (!p) return null;
  const base = PROBLEMAS[p.code] ?? "Revisa esta pieza.";
  return p.code === "INSUFFICIENT_STOCK" && p.available != null ? `${base} Quedan ${p.available}.` : base;
}

export function LineaCarrito({ linea, compacta = false }: { linea: CarritoLinea; compacta?: boolean }) {
  const { cambiar, quitar, ocupado } = useCarrito();
  const [error, setError] = useState<string | null>(null);
  const p = linea.product;
  const problema = textoProblema(linea);
  const accion = async (f: () => Promise<void>) => {
    setError(null);
    try {
      await f();
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <li className={compacta ? "linea-carrito compacta" : "linea-carrito"}>
      <div className="foto-real miniatura">
        {p?.image ? <Image src={p.image.url} alt={p.image.altText ?? p.productName} width={96} height={120} /> : null}
      </div>
      <div className="linea-datos">
        {p ? (
          <Link href={`/productos/${p.productSlug}`} className="linea-nombre">
            {p.productName}
          </Link>
        ) : (
          <span className="linea-nombre">Pieza no disponible</span>
        )}
        {p && p.variantName ? <span className="linea-variante">{p.variantName}</span> : null}
        {problema ? <span className="campo-error">{problema}</span> : null}
        {error ? (
          <span className="campo-error" role="alert">
            {error}
          </span>
        ) : null}
        <div className="linea-acciones">
          <Cantidad
            valor={linea.quantity}
            max={Math.max(linea.maxQuantity, 1)}
            onCambio={(n) => accion(() => cambiar(linea.variantId, n))}
            disabled={ocupado}
          />
          <button type="button" className="boton boton-texto" onClick={() => accion(() => quitar(linea.variantId))} disabled={ocupado}>
            Quitar
          </button>
        </div>
      </div>
      <strong className="linea-total">{formatoPesos(linea.lineTotal)}</strong>
    </li>
  );
}

export function PanelCarrito() {
  const { carrito, abierto, cerrar } = useCarrito();
  const cerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierto) return;
    cerrarRef.current?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflow;
    };
  }, [abierto, cerrar]);

  if (!abierto) return null;
  const lineas = carrito?.lines ?? [];

  return (
    <>
      <div className="velo" onClick={cerrar} aria-hidden="true" />
      <aside className="panel-lateral" role="dialog" aria-modal="true" aria-labelledby="titulo-carrito">
        <header>
          <h2 id="titulo-carrito">Tu carrito</h2>
          <button ref={cerrarRef} type="button" onClick={cerrar} aria-label="Cerrar carrito">
            <Icono nombre="cerrar" />
          </button>
        </header>
        <div className="cuerpo">
          {lineas.length === 0 ? (
            <EstadoVacio titulo="Todavía no hay piezas">
              <p>Mira lo que salió del telar esta semana.</p>
            </EstadoVacio>
          ) : (
            <ul className="lineas-carrito">
              {lineas.map((l) => (
                <LineaCarrito key={l.variantId} linea={l} compacta />
              ))}
            </ul>
          )}
        </div>
        <footer>
          {lineas.length > 0 ? (
            <>
              <p className="subtotal">
                <span>Subtotal</span>
                <strong>{formatoPesos(carrito?.subtotal ?? 0)}</strong>
              </p>
              <p className="campo-ayuda">IVA incluido. El envío se calcula al pagar.</p>
              <Link href="/carrito" className={claseBoton("accion")} onClick={cerrar}>
                Ver carrito y pagar
              </Link>
            </>
          ) : (
            <Link href="/productos" className={claseBoton("verde")} onClick={cerrar}>
              Ver el catálogo
            </Link>
          )}
        </footer>
      </aside>
    </>
  );
}
