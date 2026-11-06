"use client";

import { useQuery } from "@tanstack/react-query";
import { formatoPesos } from "@telar/ui";
import { api } from "@/lib/api-browser";
import { Buscador, Cabecera, FiltroSelect, Insignia, Paginador, Tabla, fecha, useFiltros } from "@/components/base";
import { ConPermiso } from "@/components/marco";
import { ESTADOS_PAGO } from "@/features/pedidos/estados";

const TONO = { PENDING: "ambar", APPROVED: "lleno", DECLINED: "neutro", VOIDED: "neutro", PARTIALLY_REFUNDED: "rojo", REFUNDED: "rojo", ERROR: "rojo" } as const;

export default function Pagos() {
  return (
    <ConPermiso permiso="payments:read">
      <Lista />
    </ConPermiso>
  );
}

function Lista() {
  const { valores: f, pagina, poner } = useFiltros(["pedido", "estado", "revisar"] as const);
  const lista = useQuery({
    queryKey: ["pagos", f, pagina],
    queryFn: async () =>
      (
        await api.GET("/api/v1/admin/payments", {
          params: {
            query: {
              page: pagina,
              pageSize: 25,
              orderNumber: f.pedido || undefined,
              status: (f.estado || undefined) as keyof typeof ESTADOS_PAGO | undefined,
              needsReview: f.revisar === "1" ? true : undefined,
            },
          },
        })
      ).data,
  });

  return (
    <>
      <Cabecera titulo="Pagos">
        <div className="barra-filtros">
          <Buscador valor={f.pedido} onBuscar={(pedido) => poner({ pedido: pedido.toUpperCase() })} etiqueta="Número de pedido" />
          <FiltroSelect etiqueta="Estado" valor={f.estado} opciones={Object.entries(ESTADOS_PAGO)} onCambio={(estado) => poner({ estado })} />
          <FiltroSelect etiqueta="Revisión" valor={f.revisar} opciones={[["1", "Por revisar"]]} onCambio={(revisar) => poner({ revisar })} />
        </div>
      </Cabecera>
      <Tabla
        cargando={lista.isPending}
        error={lista.error}
        filas={lista.data?.items}
        clave={(p) => p.id}
        enlace={(p) => `/pagos/${p.id}`}
        columnas={[
          { titulo: "Referencia", celda: (p) => p.reference },
          { titulo: "Pedido", celda: (p) => p.orderNumber },
          { titulo: "Fecha", celda: (p) => fecha(p.createdAt, true) },
          { titulo: "Medio", celda: (p) => p.paymentMethodType ?? "—" },
          {
            titulo: "Estado",
            celda: (p) => (
              <>
                <Insignia tono={TONO[p.status]}>{ESTADOS_PAGO[p.status]}</Insignia> {p.reviewReason ? <Insignia tono="rojo">Revisar</Insignia> : null}
              </>
            ),
          },
          { titulo: "Monto", clase: "num", celda: (p) => formatoPesos(p.amount) },
        ]}
      />
      <Paginador pagina={pagina} total={lista.data?.total ?? 0} porPagina={25} onCambio={(p) => poner({ pagina: String(p) })} />
    </>
  );
}
