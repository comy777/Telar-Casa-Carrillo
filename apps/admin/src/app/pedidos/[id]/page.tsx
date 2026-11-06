"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, CampoSelect, Esqueleto, formatoPesos } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { useSesion } from "@/lib/sesion";
import { Cabecera, Insignia, fecha } from "@/components/base";
import { ConPermiso } from "@/components/marco";
import { ESTADOS_ENVIO, ESTADOS_PAGO, ESTADOS_PEDIDO, SIGUIENTES, TONO_PEDIDO } from "@/features/pedidos/estados";

type Pedido = Schema<"AdminOrderResponse">;
type Direccion = Schema<"AddressSnapshotResponse">;

export default function DetallePedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ConPermiso permiso="orders:read">
      <Detalle id={id} />
    </ConPermiso>
  );
}

function Direccion({ d }: { d: Direccion }) {
  return (
    <address style={{ fontStyle: "normal" }}>
      {d.recipient} · {d.phone}
      <br />
      {d.line1}
      {d.line2 ? `, ${d.line2}` : ""}
      <br />
      {d.city}, {d.department} ({d.cityDaneCode}){d.postalCode ? ` · CP ${d.postalCode}` : ""}
    </address>
  );
}

function Detalle({ id }: { id: string }) {
  const qc = useQueryClient();
  const { puede } = useSesion();
  const consulta = useQuery({ queryKey: ["pedido", id], queryFn: async () => (await api.GET("/api/v1/admin/orders/{id}", { params: { path: { id } } })).data });
  const envios = useQuery({
    queryKey: ["envios-pedido", id],
    queryFn: async () => (await api.GET("/api/v1/admin/orders/{id}/shipments", { params: { path: { id } } })).data ?? [],
  });
  const pagos = useQuery({
    queryKey: ["pagos-pedido", consulta.data?.orderNumber],
    queryFn: async () => (await api.GET("/api/v1/admin/payments", { params: { query: { orderNumber: consulta.data!.orderNumber } } })).data?.items ?? [],
    enabled: Boolean(consulta.data) && puede("payments:read"),
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [nota, setNota] = useState("");
  const [factura, setFactura] = useState({ numero: "", cufe: "" });
  const [envio, setEnvio] = useState({ carrier: "", trackingNumber: "" });

  const recargar = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["pedido", id] }),
      qc.invalidateQueries({ queryKey: ["envios-pedido", id] }),
      qc.invalidateQueries({ queryKey: ["pedidos"] }),
    ]);
  };
  const hacer = async (f: () => Promise<unknown>, mensaje: string) => {
    setError(null);
    setOk(null);
    try {
      await f();
      setOk(mensaje);
      await recargar();
      return true;
    } catch (e) {
      setError(errorMessage(e));
      return false;
    }
  };

  const p: Pedido | undefined = consulta.data;
  if (consulta.isPending) return <Esqueleto alto={480} />;
  if (!p) return <Aviso tono="error">{errorMessage(consulta.error, "No encontramos el pedido.")}</Aviso>;
  const gestionar = puede("orders:manage");
  const siguientes = SIGUIENTES[p.status] ?? [];
  const enviosGestion = puede("shipping:manage");

  return (
    <>
      <Cabecera titulo={`Pedido ${p.orderNumber}`} migas={[{ href: "/pedidos", texto: "Pedidos" }]} acciones={<Insignia tono={TONO_PEDIDO[p.status]}>{ESTADOS_PEDIDO[p.status]}</Insignia>} />
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      {ok ? <Aviso tono="exito">{ok}</Aviso> : null}
      <div className="rejilla-edicion">
        <div className="grupo-campos">
          <section className="panel">
            <h2>Piezas</h2>
            <div className="tabla-envoltura">
              <table className="tabla-datos">
                <thead>
                  <tr>
                    <th>Pieza</th>
                    <th className="num">Cant.</th>
                    <th className="num">Unitario</th>
                    <th className="num">IVA</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {p.items.map((i) => (
                    <tr key={i.sku}>
                      <td>
                        {i.productName}
                        <span className="celda-secundaria">
                          {i.variantName ? `${i.variantName} · ` : ""}
                          {i.sku}
                        </span>
                      </td>
                      <td className="num">{i.quantity}</td>
                      <td className="num">{formatoPesos(i.unitPrice)}</td>
                      <td className="num">{Math.round(i.taxRate * 100)} %</td>
                      <td className="num">{formatoPesos(i.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="definiciones">
              <dt>Subtotal</dt>
              <dd>{formatoPesos(p.totals.subtotal)}</dd>
              {p.totals.discount > 0 ? (
                <>
                  <dt>Descuento {p.couponCode ? `(${p.couponCode})` : ""}</dt>
                  <dd>− {formatoPesos(p.totals.discount)}</dd>
                </>
              ) : null}
              <dt>Envío {p.shippingMethod ? `· ${p.shippingMethod.name}` : ""}</dt>
              <dd>{formatoPesos(p.totals.shipping)}</dd>
              <dt>Total</dt>
              <dd>
                <strong>{formatoPesos(p.totals.total)}</strong> (IVA incluido {formatoPesos(p.totals.tax)})
              </dd>
            </dl>
          </section>

          <section className="panel">
            <h2>Despachos</h2>
            {(envios.data ?? []).length === 0 ? <p>Sin despachos registrados.</p> : null}
            {(envios.data ?? []).map((s) => (
              <Despacho key={s.id} envio={s} gestionar={enviosGestion} hacer={hacer} />
            ))}
            {enviosGestion && ["PAID", "PROCESSING", "SHIPPED"].includes(p.status) ? (
              <form
                className="grupo-campos"
                onSubmit={(e) => {
                  e.preventDefault();
                  void hacer(
                    () => api.POST("/api/v1/admin/orders/{id}/shipments", { params: { path: { id } }, body: { carrier: envio.carrier, trackingNumber: envio.trackingNumber || undefined } }),
                    "Despacho registrado.",
                  ).then((ok) => ok && setEnvio({ carrier: "", trackingNumber: "" }));
                }}
              >
                <div className="fila-2">
                  <Campo etiqueta="Transportadora" value={envio.carrier} onChange={(e) => setEnvio({ ...envio, carrier: e.target.value })} required placeholder="Servientrega, Coordinadora…" />
                  <Campo etiqueta="Número de guía" value={envio.trackingNumber} onChange={(e) => setEnvio({ ...envio, trackingNumber: e.target.value })} />
                </div>
                <Boton type="submit" variante="borde">
                  Registrar despacho
                </Boton>
              </form>
            ) : null}
          </section>

          {pagos.data && pagos.data.length > 0 ? (
            <section className="panel">
              <h2>Pagos</h2>
              <ul className="lista-simple">
                {pagos.data.map((pg) => (
                  <li key={pg.id}>
                    <Link href={`/pagos/${pg.id}`}>
                      {pg.reference} · {pg.paymentMethodType ?? pg.provider}
                    </Link>
                    <span>
                      {formatoPesos(pg.amount)} · {ESTADOS_PAGO[pg.status]}
                      {pg.reviewReason ? <Insignia tono="rojo">Revisar</Insignia> : null}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="grupo-campos">
          {gestionar && siguientes.length > 0 ? (
            <section className="panel">
              <h2>Avanzar el pedido</h2>
              <Campo etiqueta="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} />
              <div className="acciones-fila">
                {siguientes.map((s) => (
                  <Boton
                    key={s}
                    variante={s === "CANCELLED" ? "peligro" : "verde"}
                    onClick={() => {
                      if (s === "CANCELLED" && !window.confirm("¿Cancelar el pedido? Se liberan las piezas.")) return;
                      void hacer(() => api.PATCH("/api/v1/admin/orders/{id}/status", { params: { path: { id } }, body: { status: s, note: nota || undefined } }), `Pedido: ${ESTADOS_PEDIDO[s]}.`).then(
                        () => setNota(""),
                      );
                    }}
                  >
                    {s === "CANCELLED" ? "Cancelar" : `Marcar ${ESTADOS_PEDIDO[s].toLowerCase()}`}
                  </Boton>
                ))}
              </div>
              {p.status === "PAID" || p.status === "PROCESSING" ? (
                <p className="campo-ayuda">Si el pedido ya está pagado, cancelarlo no devuelve el dinero: haz el reembolso desde Pagos.</p>
              ) : null}
            </section>
          ) : null}

          <section className="panel">
            <h2>Cliente</h2>
            <dl className="definiciones">
              <dt>Nombre</dt>
              <dd>{p.customerName}</dd>
              <dt>Correo</dt>
              <dd>
                <a href={`mailto:${p.customerEmail}`}>{p.customerEmail}</a>
              </dd>
              {p.customerPhone ? (
                <>
                  <dt>Celular</dt>
                  <dd>{p.customerPhone}</dd>
                </>
              ) : null}
              <dt>Documento</dt>
              <dd>{p.customerDocumentType ? `${p.customerDocumentType} ${p.customerDocumentNumber}` : "Consumidor final"}</dd>
              <dt>Cuenta</dt>
              <dd>{p.userId ? "Registrado" : "Invitado"}</dd>
            </dl>
            <h3>Entrega</h3>
            <Direccion d={p.shippingAddress} />
            {p.notes ? <p className="bloque-texto">{p.notes}</p> : null}
          </section>

          <section className="panel">
            <h2>Factura electrónica</h2>
            {p.invoiceNumber ? (
              <p>
                <strong>{p.invoiceNumber}</strong>
                {p.invoiceCufe ? <span className="celda-secundaria">CUFE {p.invoiceCufe}</span> : null}
              </p>
            ) : p.paidAt && gestionar ? (
              <form
                className="grupo-campos"
                onSubmit={(e) => {
                  e.preventDefault();
                  void hacer(() => api.PUT("/api/v1/admin/orders/{id}/invoice", { params: { path: { id } }, body: { invoiceNumber: factura.numero, cufe: factura.cufe || undefined } }), "Factura registrada.");
                }}
              >
                <Campo etiqueta="Número de factura" value={factura.numero} onChange={(e) => setFactura({ ...factura, numero: e.target.value })} required />
                <Campo etiqueta="CUFE (opcional)" value={factura.cufe} onChange={(e) => setFactura({ ...factura, cufe: e.target.value })} />
                <Boton type="submit" variante="borde">
                  Registrar factura
                </Boton>
              </form>
            ) : (
              <p>Se registra cuando el pedido esté pagado.</p>
            )}
          </section>

          <section className="panel">
            <h2>Historial</h2>
            <ol className="linea-tiempo">
              {[...p.history].reverse().map((h, i) => (
                <li key={i}>
                  <strong>{ESTADOS_PEDIDO[h.status]}</strong>
                  {h.note ? ` — ${h.note}` : ""}
                  <span>{fecha(h.at, true)}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}

function Despacho({
  envio: s,
  gestionar,
  hacer,
}: {
  envio: Schema<"ShipmentResponse">;
  gestionar: boolean;
  hacer: (f: () => Promise<unknown>, m: string) => Promise<boolean>;
}) {
  const [estado, setEstado] = useState<keyof typeof ESTADOS_ENVIO>("IN_TRANSIT");
  const [desc, setDesc] = useState("");
  return (
    <div className="grupo-campos" style={{ borderTop: "1px solid var(--cal-sombra)", paddingTop: 12 }}>
      <p>
        <strong>{s.carrier ?? "Despacho"}</strong> {s.trackingNumber ? `· Guía ${s.trackingNumber}` : ""} · <Insignia tono="verde">{ESTADOS_ENVIO[s.status]}</Insignia>
      </p>
      {s.events.length > 0 ? (
        <ol className="linea-tiempo">
          {[...s.events].reverse().map((e, i) => (
            <li key={i}>
              {ESTADOS_ENVIO[e.status]}
              {e.description ? ` — ${e.description}` : ""}
              <span>{fecha(e.occurredAt, true)}</span>
            </li>
          ))}
        </ol>
      ) : null}
      {gestionar && s.status !== "DELIVERED" && s.status !== "RETURNED" ? (
        <form
          className="fila-3"
          onSubmit={(e) => {
            e.preventDefault();
            void hacer(() => api.POST("/api/v1/admin/shipments/{id}/events", { params: { path: { id: s.id } }, body: { status: estado, description: desc || undefined } }), "Novedad registrada.").then(() => setDesc(""));
          }}
        >
          <CampoSelect etiqueta="Novedad" value={estado} onChange={(e) => setEstado(e.target.value as keyof typeof ESTADOS_ENVIO)}>
            {Object.entries(ESTADOS_ENVIO).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </CampoSelect>
          <Campo etiqueta="Detalle" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Boton type="submit" variante="borde" className="casilla-alineada">
            Agregar
          </Boton>
        </form>
      ) : null}
    </div>
  );
}
