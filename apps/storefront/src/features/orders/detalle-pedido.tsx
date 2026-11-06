"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatoPesos, cx } from "@telar/ui";
import type { Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { TextoDireccion } from "@/features/account/texto-direccion";

export type Pedido = Schema<"OrderResponse">;
type EstadoPedido = Pedido["status"];

export const ESTADOS: Record<EstadoPedido, string> = {
  PENDING_PAYMENT: "Esperando el pago",
  PAID: "Pagado",
  PROCESSING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

const ESTADOS_ENVIO: Record<string, string> = {
  PENDING: "Por despachar",
  READY: "Listo para despachar",
  IN_TRANSIT: "En camino",
  DELIVERED: "Entregado",
  FAILED: "Intento de entrega fallido",
  RETURNED: "Devuelto",
};

const PASOS: EstadoPedido[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"];

export const fecha = (iso: string, conHora = false) =>
  new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    ...(conHora ? { timeStyle: "short" } : {}),
    timeZone: "America/Bogota",
  }).format(new Date(iso));

export function InsigniaEstado({ estado }: { estado: EstadoPedido }) {
  return <span className={cx("insignia", `estado-${estado.toLowerCase()}`)}>{ESTADOS[estado]}</span>;
}

/** Pasos del pedido como pasadas de trama: las hechas, tejidas; las que faltan, en hilo suelto. */
function Avance({ pedido }: { pedido: Pedido }) {
  if (pedido.status === "CANCELLED" || pedido.status === "REFUNDED" || pedido.status === "PENDING_PAYMENT") return null;
  const actual = PASOS.indexOf(pedido.status);
  return (
    <ol className="avance" aria-label="Avance del pedido">
      {PASOS.map((p, i) => (
        <li key={p} className={i <= actual ? "hecho" : undefined} aria-current={i === actual ? "step" : undefined}>
          {ESTADOS[p]}
        </li>
      ))}
    </ol>
  );
}

export function DetallePedido({ pedido }: { pedido: Pedido }) {
  const seguimiento = useQuery({
    queryKey: ["seguimiento", pedido.orderNumber],
    queryFn: async () =>
      (
        await api.GET("/api/v1/orders/{orderNumber}/tracking", {
          params: { path: { orderNumber: pedido.orderNumber } },
        })
      ).data,
    enabled: ["PROCESSING", "SHIPPED", "DELIVERED"].includes(pedido.status),
  });
  const t = pedido.totals;

  return (
    <article className="pedido">
      <header className="pedido-cabeza">
        <div>
          <h2>Pedido {pedido.orderNumber}</h2>
          <p>Hecho el {fecha(pedido.createdAt, true)}</p>
        </div>
        <InsigniaEstado estado={pedido.status} />
      </header>

      <Avance pedido={pedido} />

      {pedido.status === "PENDING_PAYMENT" && pedido.paymentDueAt ? (
        <div className="aviso aviso-info" role="status">
          <div>
            Tienes hasta el {fecha(pedido.paymentDueAt, true)} para pagar. Después liberamos las piezas.{" "}
            <Link href={`/pedido/${pedido.orderNumber}/pago`}>Pagar ahora</Link>
          </div>
        </div>
      ) : null}

      <ul className="pedido-lineas">
        {pedido.items.map((i) => (
          <li key={i.sku}>
            <div className="foto-real miniatura">
              {i.image ? <Image src={i.image.url} alt={i.image.altText ?? i.productName} width={72} height={90} /> : null}
            </div>
            <div>
              {i.productSlug ? <Link href={`/productos/${i.productSlug}`}>{i.productName}</Link> : <span>{i.productName}</span>}
              {i.variantName && i.variantName !== "Única" ? <span className="linea-variante">{i.variantName}</span> : null}
              <span className="linea-variante">
                {i.quantity} × {formatoPesos(i.unitPrice)}
              </span>
            </div>
            <strong>{formatoPesos(i.total)}</strong>
          </li>
        ))}
      </ul>

      <dl className="totales">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatoPesos(t.subtotal)}</dd>
        </div>
        {t.discount > 0 ? (
          <div>
            <dt>Descuento{pedido.couponCode ? ` (${pedido.couponCode})` : ""}</dt>
            <dd>− {formatoPesos(t.discount)}</dd>
          </div>
        ) : null}
        <div>
          <dt>Envío{pedido.shippingMethod ? ` · ${pedido.shippingMethod.name}` : ""}</dt>
          <dd>{t.shipping === 0 ? "Gratis" : formatoPesos(t.shipping)}</dd>
        </div>
        <div className="total">
          <dt>Total</dt>
          <dd>{formatoPesos(t.total)}</dd>
        </div>
        <div className="iva">
          <dt>IVA incluido</dt>
          <dd>{formatoPesos(t.tax)}</dd>
        </div>
      </dl>

      <section className="pedido-envio" aria-labelledby={`envio-${pedido.orderNumber}`}>
        <h3 id={`envio-${pedido.orderNumber}`}>Entrega</h3>
        <TextoDireccion d={pedido.shippingAddress} />
        {seguimiento.data?.shipments.map((s) => (
          <div key={s.id} className="despacho">
            <p>
              <strong>{ESTADOS_ENVIO[s.status] ?? s.status}</strong>
              {s.carrier ? ` · ${s.carrier}` : ""}
              {s.trackingNumber ? (
                <>
                  {" "}
                  · Guía <span className="guia">{s.trackingNumber}</span>
                </>
              ) : null}
            </p>
            {s.events.length > 0 ? (
              <ol className="eventos">
                {[...s.events].reverse().map((e, i) => (
                  <li key={i}>
                    <time dateTime={e.occurredAt}>{fecha(e.occurredAt, true)}</time> — {e.description ?? ESTADOS_ENVIO[e.status] ?? e.status}
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ))}
      </section>

      {pedido.invoiceNumber ? <p className="nota-iva">Factura electrónica {pedido.invoiceNumber}</p> : null}
    </article>
  );
}
