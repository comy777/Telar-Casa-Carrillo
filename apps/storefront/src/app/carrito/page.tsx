"use client";

import Link from "next/link";
import { Aviso, EstadoVacio, Esqueleto, claseBoton, formatoPesos } from "@telar/ui";
import { LineaCarrito } from "@/features/cart/panel-carrito";
import { useCarrito } from "@/features/cart/cart-context";
import { CHECKOUT_DISABLED } from "@/lib/env";

export default function Carrito() {
  const { carrito, cargando } = useCarrito();
  const lineas = carrito?.lines ?? [];
  const conProblemas = lineas.some((l) => l.issues.length > 0);

  return (
    <main className="envoltura carrito-pagina">
      <p className="migas">
        <Link href="/">Inicio</Link> / Carrito
      </p>
      <h1 className="titulo-pagina">Tu carrito</h1>

      {cargando ? (
        <Esqueleto alto={260} />
      ) : lineas.length === 0 ? (
        <EstadoVacio
          titulo="Todavía no hay piezas en el carrito"
          accion={
            <Link href="/productos" className={claseBoton("verde")}>
              Ver el catálogo
            </Link>
          }
        />
      ) : (
        <div className="carrito-cuerpo">
          <section aria-label="Piezas en el carrito">
            {conProblemas ? (
              <Aviso tono="error">Algunas piezas cambiaron de disponibilidad. Ajusta las cantidades o quítalas para continuar.</Aviso>
            ) : null}
            <ul className="lineas-carrito">
              {lineas.map((l) => (
                <LineaCarrito key={l.variantId} linea={l} />
              ))}
            </ul>
          </section>
          <aside className="tabla resumen" aria-labelledby="t-resumen">
            <h2 id="t-resumen">Resumen</h2>
            <p className="subtotal">
              <span>Subtotal</span>
              <strong>{formatoPesos(carrito?.subtotal ?? 0)}</strong>
            </p>
            <p className="nota-iva">IVA incluido. El envío y los cupones se calculan en el siguiente paso.</p>
            {CHECKOUT_DISABLED ? (
              <Aviso tono="info">La tienda está en mantenimiento. Podrás pagar en un rato; tu carrito se guarda.</Aviso>
            ) : (
              <Link
                href="/checkout"
                className={claseBoton("accion")}
                aria-disabled={!carrito?.canCheckout || undefined}
                onClick={(e) => !carrito?.canCheckout && e.preventDefault()}
              >
                Continuar al pago
              </Link>
            )}
            <Link href="/productos" className="ver-mas">
              Seguir viendo piezas
            </Link>
          </aside>
        </div>
      )}
    </main>
  );
}
