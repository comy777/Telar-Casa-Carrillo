"use client";

import Link from "next/link";
import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, Casilla, Esqueleto, formatoPesos } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { useSesion } from "@/lib/sesion";
import { Cabecera, Insignia, fecha } from "@/components/base";
import { ConPermiso } from "@/components/marco";
import { ESTADOS_PAGO } from "@/features/pedidos/estados";

const MOTIVOS_REVISION: Record<string, string> = {
  ORDER_NOT_PAYABLE: "Llegó un pago para un pedido vencido o cancelado",
  AMOUNT_MISMATCH: "El monto no coincide con el pedido",
  DUPLICATE_PAYMENT: "Pago duplicado",
  STOCK_SHORTAGE: "No había unidades al confirmar el pago",
};
const ESTADOS_REEMBOLSO = { PENDING: "En curso", APPROVED: "Aprobado", FAILED: "Fallido" } as const;

export default function DetallePago({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ConPermiso permiso="payments:read">
      <Detalle id={id} />
    </ConPermiso>
  );
}

function Detalle({ id }: { id: string }) {
  const qc = useQueryClient();
  const { puede } = useSesion();
  const pago = useQuery({ queryKey: ["pago", id], queryFn: async () => (await api.GET("/api/v1/admin/payments/{id}", { params: { path: { id } } })).data });
  const [monto, setMonto] = useState("");
  const [motivo, setMotivo] = useState("");
  const [reponer, setReponer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  // Una clave por intento de reembolso: si se reintenta por un corte, Wompi no devuelve dos veces.
  const [clave, setClave] = useState(() => crypto.randomUUID());

  const p = pago.data;
  if (pago.isPending) return <Esqueleto alto={360} />;
  if (!p) return <Aviso tono="error">{errorMessage(pago.error, "No encontramos el pago.")}</Aviso>;

  const reembolsado = (p.refunds ?? []).filter((r) => r.status !== "FAILED").reduce((s, r) => s + r.amount, 0);
  const disponible = Math.max(0, p.amount - reembolsado);
  const puedeReembolsar = puede("payments:refund") && ["APPROVED", "PARTIALLY_REFUNDED"].includes(p.status) && disponible > 0;

  const hacer = async (f: () => Promise<unknown>, m: string) => {
    setError(null);
    setOk(null);
    setEnviando(true);
    try {
      await f();
      setOk(m);
      await qc.invalidateQueries({ queryKey: ["pago", id] });
      await qc.invalidateQueries({ queryKey: ["pagos"] });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Cabecera titulo={`Pago ${p.reference}`} migas={[{ href: "/pagos", texto: "Pagos" }]} acciones={<Insignia tono="lleno">{ESTADOS_PAGO[p.status]}</Insignia>} />
      {p.reviewReason ? (
        <Aviso tono="error">
          Este pago necesita revisión: {MOTIVOS_REVISION[p.reviewReason] ?? p.reviewReason}. Decide con el cliente si se despacha o se reembolsa.
        </Aviso>
      ) : null}
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      {ok ? <Aviso tono="exito">{ok}</Aviso> : null}
      <div className="rejilla-edicion">
        <section className="panel">
          <h2>Detalle</h2>
          <dl className="definiciones">
            <dt>Pedido</dt>
            <dd>
              <Link href={`/pedidos?q=${p.orderNumber}`}>{p.orderNumber}</Link>
            </dd>
            <dt>Monto</dt>
            <dd>{formatoPesos(p.amount)}</dd>
            <dt>Reembolsado</dt>
            <dd>{formatoPesos(reembolsado)}</dd>
            <dt>Pasarela</dt>
            <dd>{p.provider}</dd>
            <dt>Medio</dt>
            <dd>{p.paymentMethodType ?? "—"}</dd>
            <dt>Transacción</dt>
            <dd>{p.transactionId ?? "—"}</dd>
            <dt>Creado</dt>
            <dd>{fecha(p.createdAt, true)}</dd>
          </dl>
          <h3>Reembolsos</h3>
          {(p.refunds ?? []).length === 0 ? (
            <p>Sin reembolsos.</p>
          ) : (
            <ul className="lista-simple">
              {p.refunds!.map((r) => (
                <li key={r.id}>
                  <span>
                    {formatoPesos(r.amount)} · {r.reason}
                    <span className="celda-secundaria">
                      {fecha(r.createdAt, true)}
                      {r.failureReason ? ` · ${r.failureReason}` : ""}
                    </span>
                  </span>
                  <span className="acciones-fila">
                    <Insignia tono={r.status === "APPROVED" ? "verde" : r.status === "FAILED" ? "rojo" : "ambar"}>{ESTADOS_REEMBOLSO[r.status]}</Insignia>
                    {r.status === "PENDING" && puede("payments:refund") ? (
                      <>
                        <Boton variante="texto" onClick={() => hacer(() => api.PATCH("/api/v1/admin/refunds/{id}", { params: { path: { id: r.id } }, body: { status: "APPROVED", restock: false } }), "Reembolso confirmado.")}>
                          Confirmar
                        </Boton>
                        <Boton variante="texto" onClick={() => hacer(() => api.PATCH("/api/v1/admin/refunds/{id}", { params: { path: { id: r.id } }, body: { status: "FAILED", restock: false } }), "Reembolso marcado como fallido.")}>
                          Falló
                        </Boton>
                      </>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        {puedeReembolsar ? (
          <form
            className="panel"
            onSubmit={(e) => {
              e.preventDefault();
              const valor = monto ? Number(monto) : disponible;
              if (!window.confirm(`¿Reembolsar ${formatoPesos(valor)} por Wompi? No se puede deshacer.`)) return;
              void hacer(
                () =>
                  api.POST("/api/v1/admin/payments/{id}/refunds", {
                    params: { path: { id }, header: { "Idempotency-Key": clave } },
                    body: { amount: monto ? Number(monto) : undefined, reason: motivo, restock: reponer },
                  }),
                "Reembolso solicitado a Wompi.",
              ).then(() => setClave(crypto.randomUUID()));
            }}
          >
            <h2>Reembolsar</h2>
            <p className="campo-ayuda">Puedes devolver hasta {formatoPesos(disponible)}. Un reembolso total cancela el pedido (o lo deja reembolsado si ya se envió).</p>
            <Campo etiqueta="Monto (vacío = todo lo disponible)" type="number" min={1} max={disponible} step={100} value={monto} onChange={(e) => setMonto(e.target.value)} />
            <Campo etiqueta="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} required placeholder="Retracto del cliente (Ley 1480)" />
            <Casilla checked={reponer} onChange={(e) => setReponer(e.target.checked)}>
              Devolver las piezas al inventario
            </Casilla>
            <Boton type="submit" variante="peligro" cargando={enviando}>
              Reembolsar
            </Boton>
          </form>
        ) : null}
      </div>
    </>
  );
}
