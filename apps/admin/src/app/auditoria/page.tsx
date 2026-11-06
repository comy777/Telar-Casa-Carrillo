"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-browser";
import { Buscador, Cabecera, Paginador, Tabla, fecha, useFiltros } from "@/components/base";
import { ConPermiso } from "@/components/marco";

export default function Auditoria() {
  return (
    <ConPermiso permiso="audit:read">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const { valores: f, pagina, poner } = useFiltros(["accion", "recurso"] as const);
  const lista = useQuery({
    queryKey: ["auditoria", f, pagina],
    queryFn: async () =>
      (await api.GET("/api/v1/admin/audit-logs", { params: { query: { page: pagina, pageSize: 50, action: f.accion || undefined, resource: f.recurso || undefined } } }))
        .data,
  });

  return (
    <>
      <Cabecera titulo="Auditoría">
        <p className="campo-ayuda">Quién cambió qué y cuándo. Solo se agregan registros: nada se edita ni se borra.</p>
        <div className="barra-filtros">
          <Buscador valor={f.accion} onBuscar={(accion) => poner({ accion })} etiqueta="Acción (p. ej. product.updated)" />
          <Buscador valor={f.recurso} onBuscar={(recurso) => poner({ recurso })} etiqueta="Recurso (p. ej. Order)" />
        </div>
      </Cabecera>
      <Tabla
        cargando={lista.isPending}
        error={lista.error}
        filas={lista.data?.items}
        clave={(r) => r.id}
        columnas={[
          { titulo: "Fecha", celda: (r) => fecha(r.createdAt, true) },
          { titulo: "Quién", celda: (r) => r.actorEmail ?? "Sistema" },
          { titulo: "Acción", celda: (r) => <code>{r.action}</code> },
          {
            titulo: "Recurso",
            celda: (r) => (
              <>
                {r.resource}
                {r.resourceId ? <span className="celda-secundaria">{r.resourceId}</span> : null}
              </>
            ),
          },
          { titulo: "IP", celda: (r) => r.ipAddress ?? "—" },
        ]}
      />
      <Paginador pagina={pagina} total={lista.data?.total ?? 0} porPagina={50} onCambio={(p) => poner({ pagina: String(p) })} />
    </>
  );
}
