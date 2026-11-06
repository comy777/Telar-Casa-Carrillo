"use client";

import { useQuery } from "@tanstack/react-query";
import { formatoPesos } from "@telar/ui";
import { api } from "@/lib/api-browser";
import { Buscador, Cabecera, FiltroSelect, Insignia, Paginador, Tabla, fecha, useFiltros } from "@/components/base";
import { ConPermiso } from "@/components/marco";
import { ESTADOS_PEDIDO, TONO_PEDIDO, type EstadoPedido } from "@/features/pedidos/estados";

export default function Pedidos() {
  return (
    <ConPermiso permiso="orders:read">
      <Lista />
    </ConPermiso>
  );
}

function Lista() {
  const { valores: f, pagina, poner } = useFiltros(["q", "estado", "desde", "hasta", "factura"] as const);
  const lista = useQuery({
    queryKey: ["pedidos", f, pagina],
    queryFn: async () =>
      (
        await api.GET("/api/v1/admin/orders", {
          params: {
            query: {
              page: pagina,
              pageSize: 25,
              search: f.q || undefined,
              status: (f.estado || undefined) as EstadoPedido | undefined,
              from: f.desde || undefined,
              to: f.hasta || undefined,
              invoicePending: f.factura === "pendiente" ? true : undefined,
            },
          },
        })
      ).data,
  });

  return (
    <>
      <Cabecera titulo="Pedidos">
        <div className="barra-filtros">
          <Buscador valor={f.q} onBuscar={(q) => poner({ q })} etiqueta="Número, cliente o correo" />
          <FiltroSelect etiqueta="Estado" valor={f.estado} opciones={Object.entries(ESTADOS_PEDIDO)} onCambio={(estado) => poner({ estado })} />
          <FiltroSelect etiqueta="Factura" valor={f.factura} opciones={[["pendiente", "Por registrar"]]} onCambio={(factura) => poner({ factura })} />
          <label className="filtro">
            <span>Desde</span>
            <input type="date" value={f.desde} onChange={(e) => poner({ desde: e.target.value })} className="campo-fecha" />
          </label>
          <label className="filtro">
            <span>Hasta</span>
            <input type="date" value={f.hasta} onChange={(e) => poner({ hasta: e.target.value })} className="campo-fecha" />
          </label>
        </div>
      </Cabecera>
      <Tabla
        cargando={lista.isPending}
        error={lista.error}
        filas={lista.data?.items}
        clave={(p) => p.id}
        enlace={(p) => `/pedidos/${p.id}`}
        columnas={[
          { titulo: "Pedido", celda: (p) => p.orderNumber },
          { titulo: "Fecha", celda: (p) => fecha(p.createdAt, true) },
          {
            titulo: "Cliente",
            celda: (p) => (
              <>
                {p.customerName}
                <span className="celda-secundaria">{p.userId ? "Con cuenta" : "Invitado"} · {p.shippingAddress.city}</span>
              </>
            ),
          },
          { titulo: "Estado", celda: (p) => <Insignia tono={TONO_PEDIDO[p.status]}>{ESTADOS_PEDIDO[p.status]}</Insignia> },
          { titulo: "Factura", celda: (p) => p.invoiceNumber ?? (p.paidAt ? <Insignia tono="ambar">Pendiente</Insignia> : "—") },
          { titulo: "Total", clase: "num", celda: (p) => formatoPesos(p.totals.total) },
        ]}
      />
      <Paginador pagina={pagina} total={lista.data?.total ?? 0} porPagina={25} onCambio={(p) => poner({ pagina: String(p) })} />
    </>
  );
}
