"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Aviso, Esqueleto, formatoPesos } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { Cabecera, FiltroSelect, Insignia } from "@/components/base";
import { ConPermiso } from "@/components/marco";
import { ESTADOS_PEDIDO } from "@/features/pedidos/estados";

/** Fecha de hoy y del primer día del mes en Colombia (AAAA-MM-DD). */
function rango(tipo: string): { from?: string; to?: string } {
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
  if (tipo === "mes") return { from: `${hoy.slice(0, 8)}01`, to: hoy };
  if (tipo === "anio") return { from: `${hoy.slice(0, 5)}01-01`, to: hoy };
  if (tipo === "7") {
    const d = new Date(Date.now() - 6 * 86_400_000);
    return { from: new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(d), to: hoy };
  }
  return {}; // últimos 30 días (por defecto del backend)
}

const RANGOS: Array<[string, string]> = [
  ["7", "Últimos 7 días"],
  ["mes", "Este mes"],
  ["anio", "Este año"],
];

export default function Resumen() {
  return (
    <ConPermiso permiso="reports:read">
      <Contenido />
    </ConPermiso>
  );
}

function Contenido() {
  const [periodo, setPeriodo] = useState("mes");
  const r = rango(periodo);
  const m = useQuery({
    queryKey: ["metricas", r.from, r.to],
    queryFn: async () => (await api.GET("/api/v1/admin/metrics", { params: { query: r } })).data,
  });
  const total = useQuery({
    queryKey: ["metricas", "anio"],
    queryFn: async () => (await api.GET("/api/v1/admin/metrics", { params: { query: rango("anio") } })).data,
  });

  const d = m.data;
  const maxDia = Math.max(1, ...(d?.salesByDay.map((x) => x.revenue) ?? [1]));

  return (
    <>
      <Cabecera titulo="Resumen">
        <div className="barra-filtros">
          <FiltroSelect etiqueta="Periodo" valor={periodo} opciones={RANGOS} onCambio={(v) => setPeriodo(v || "mes")} />
        </div>
      </Cabecera>

      {m.error ? <Aviso tono="error">{errorMessage(m.error)}</Aviso> : null}
      {!d ? (
        <Esqueleto alto={360} />
      ) : (
        <>
          <section className="indicadores" aria-label="Indicadores">
            <div className="indicador">
              <span>Ventas del periodo</span>
              <strong>{formatoPesos(d.sales.revenue)}</strong>
              <small>{d.sales.paidOrders === 1 ? "1 pedido pagado" : `${d.sales.paidOrders} pedidos pagados`}</small>
            </div>
            <div className="indicador">
              <span>Ventas del año</span>
              <strong>{total.data ? formatoPesos(total.data.sales.revenue) : "…"}</strong>
              <small>Neto de reembolsos: {total.data ? formatoPesos(total.data.sales.netRevenue) : "…"}</small>
            </div>
            <Link href="/pedidos?estado=PAID" className="indicador claro">
              <span>Pedidos por preparar</span>
              <strong>{d.operations.awaitingFulfillment}</strong>
              <small>Pagados o en preparación</small>
            </Link>
            <div className="indicador claro">
              <span>Clientes registrados</span>
              <strong>{d.customers.total}</strong>
              <small>{d.customers.newInRange} nuevos en el periodo</small>
            </div>
            <Link href="/inventario?stock=low" className={`indicador claro${d.operations.lowStockVariants + d.operations.outOfStockVariants > 0 ? " alerta" : ""}`}>
              <span>Inventario bajo</span>
              <strong>{d.operations.lowStockVariants + d.operations.outOfStockVariants}</strong>
              <small>{d.operations.outOfStockVariants} agotadas</small>
            </Link>
            <Link href="/pagos?revisar=1" className={`indicador claro${d.operations.paymentsNeedingReview > 0 ? " alerta" : ""}`}>
              <span>Pagos por revisar</span>
              <strong>{d.operations.paymentsNeedingReview}</strong>
              <small>{d.operations.unpaidOrders} pedidos sin pagar</small>
            </Link>
          </section>

          <div className="rejilla-2">
            <section className="panel" aria-labelledby="t-dias">
              <h2 id="t-dias">Ventas por día</h2>
              {d.salesByDay.length === 0 ? (
                <p>Sin ventas en el periodo.</p>
              ) : (
                <>
                  <div className="barras" role="img" aria-label={`Ventas diarias entre ${d.salesByDay[0]?.day} y ${d.salesByDay.at(-1)?.day}`}>
                    {d.salesByDay.map((x) => (
                      <div key={x.day} style={{ height: `${(x.revenue / maxDia) * 100}%` }} title={`${x.day}: ${formatoPesos(x.revenue)} (${x.orders} pedidos)`} />
                    ))}
                  </div>
                  <div className="barras-eje">
                    <span>{d.salesByDay[0]?.day}</span>
                    <span>{d.salesByDay.at(-1)?.day}</span>
                  </div>
                </>
              )}
              <dl className="definiciones">
                <dt>Ticket promedio</dt>
                <dd>{formatoPesos(d.sales.averageOrder)}</dd>
                <dt>IVA incluido</dt>
                <dd>{formatoPesos(d.sales.tax)}</dd>
                <dt>Envíos cobrados</dt>
                <dd>{formatoPesos(d.sales.shipping)}</dd>
                <dt>Descuentos</dt>
                <dd>{formatoPesos(d.sales.discount)}</dd>
                <dt>Reembolsos</dt>
                <dd>{formatoPesos(d.sales.refunded)}</dd>
              </dl>
            </section>

            <section className="panel" aria-labelledby="t-top">
              <h2 id="t-top">Más vendidos</h2>
              {d.topProducts.length === 0 ? (
                <p>Sin ventas en el periodo.</p>
              ) : (
                <ol className="lista-simple">
                  {d.topProducts.map((p) => (
                    <li key={p.sku}>
                      <span>
                        {p.productName}
                        <span className="celda-secundaria">{p.sku}</span>
                      </span>
                      <span>
                        {p.quantity} u · {formatoPesos(p.revenue)}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="panel" aria-labelledby="t-bajo">
              <div className="panel-cabeza">
                <h2 id="t-bajo">Inventario bajo</h2>
                <Link href="/inventario?stock=low">Ver inventario</Link>
              </div>
              {d.lowStock.length === 0 ? (
                <p>Todas las piezas publicadas tienen unidades suficientes.</p>
              ) : (
                <ul className="lista-simple">
                  {d.lowStock.map((v) => (
                    <li key={v.variantId}>
                      <span>
                        {v.productName}
                        <span className="celda-secundaria">
                          {v.variantName} · {v.sku}
                        </span>
                      </span>
                      <Insignia tono={v.available <= 0 ? "rojo" : "ambar"}>{v.available <= 0 ? "Agotada" : `Quedan ${v.available}`}</Insignia>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="panel" aria-labelledby="t-estados">
              <h2 id="t-estados">Pedidos por estado</h2>
              <ul className="lista-simple">
                {Object.entries(d.ordersByStatus).map(([estado, n]) => (
                  <li key={estado}>
                    <Link href={`/pedidos?estado=${estado}`}>{ESTADOS_PEDIDO[estado as keyof typeof ESTADOS_PEDIDO] ?? estado}</Link>
                    <strong>{n}</strong>
                  </li>
                ))}
              </ul>
              <dl className="definiciones">
                <dt>Facturas por registrar</dt>
                <dd>
                  <Link href="/pedidos?factura=pendiente">{d.operations.pendingInvoices}</Link>
                </dd>
                <dt>Mensajes nuevos</dt>
                <dd>
                  <Link href="/mensajes">{d.operations.newContactMessages}</Link>
                </dd>
              </dl>
            </section>
          </div>
        </>
      )}
    </>
  );
}
