"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { Cabecera, FiltroSelect, Insignia, Paginador, Tabla, fecha, useFiltros } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Mensaje = Schema<"ContactMessageResponse">;
const ESTADOS = { NEW: "Nuevo", READ: "Leído", ARCHIVED: "Archivado" } as const;

export default function Mensajes() {
  return (
    <ConPermiso permiso="messages:read">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const qc = useQueryClient();
  const { valores: f, pagina, poner } = useFiltros(["estado", "vista"] as const);
  const [abierto, setAbierto] = useState<Mensaje | null>(null);
  const [error, setError] = useState<string | null>(null);
  const vista = f.vista || "mensajes";
  const mensajes = useQuery({
    queryKey: ["mensajes", f.estado, pagina],
    queryFn: async () =>
      (
        await api.GET("/api/v1/admin/contact-messages", {
          params: { query: { page: pagina, pageSize: 25, status: (f.estado || undefined) as keyof typeof ESTADOS | undefined } },
        })
      ).data,
    enabled: vista === "mensajes",
  });
  const suscriptores = useQuery({
    queryKey: ["suscriptores", pagina],
    queryFn: async () => (await api.GET("/api/v1/admin/newsletter-subscribers", { params: { query: { page: pagina, pageSize: 50, onlyActive: true } } })).data,
    enabled: vista === "boletin",
  });

  const marcar = async (m: Mensaje, status: keyof typeof ESTADOS) => {
    setError(null);
    try {
      const { data } = await api.PATCH("/api/v1/admin/contact-messages/{id}", { params: { path: { id: m.id } }, body: { status } });
      if (data && abierto?.id === m.id) setAbierto(data);
      await qc.invalidateQueries({ queryKey: ["mensajes"] });
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <>
      <Cabecera titulo="Mensajes y boletín">
        <div className="barra-filtros">
          <FiltroSelect etiqueta="Ver" valor={vista === "boletin" ? "boletin" : ""} opciones={[["boletin", "Suscriptores del boletín"]]} onCambio={(v) => poner({ vista: v })} />
          {vista === "mensajes" ? <FiltroSelect etiqueta="Estado" valor={f.estado} opciones={Object.entries(ESTADOS)} onCambio={(estado) => poner({ estado })} /> : null}
        </div>
      </Cabecera>
      {error ? <Aviso tono="error">{error}</Aviso> : null}

      {vista === "boletin" ? (
        <>
          <p className="campo-ayuda">Solo suscripciones confirmadas por correo y vigentes. Cada una aceptó la política de datos.</p>
          <Tabla
            cargando={suscriptores.isPending}
            error={suscriptores.error}
            filas={suscriptores.data?.items}
            clave={(s) => s.id}
            columnas={[
              { titulo: "Correo", celda: (s) => s.email },
              { titulo: "Confirmó", celda: (s) => fecha(s.confirmedAt) },
              { titulo: "Desde", celda: (s) => fecha(s.createdAt) },
            ]}
          />
          <Paginador pagina={pagina} total={suscriptores.data?.total ?? 0} porPagina={50} onCambio={(p) => poner({ pagina: String(p) })} />
        </>
      ) : (
        <div className="rejilla-edicion">
          <div className="grupo-campos">
            <Tabla
              cargando={mensajes.isPending}
              error={mensajes.error}
              filas={mensajes.data?.items}
              clave={(m) => m.id}
              columnas={[
                {
                  titulo: "De",
                  celda: (m) => (
                    <button
                      type="button"
                      className="boton boton-texto"
                      style={{ display: "block", textAlign: "left", fontWeight: m.status === "NEW" ? 700 : 400 }}
                      onClick={() => {
                        setAbierto(m);
                        if (m.status === "NEW") void marcar(m, "READ");
                      }}
                    >
                      {m.name}
                      <span className="celda-secundaria">{m.subject ?? m.message.slice(0, 60)}</span>
                    </button>
                  ),
                },
                { titulo: "Fecha", celda: (m) => fecha(m.createdAt, true) },
                { titulo: "Estado", celda: (m) => <Insignia tono={m.status === "NEW" ? "ambar" : "neutro"}>{ESTADOS[m.status]}</Insignia> },
              ]}
            />
            <Paginador pagina={pagina} total={mensajes.data?.total ?? 0} porPagina={25} onCambio={(p) => poner({ pagina: String(p) })} />
          </div>
          {abierto ? (
            <section className="panel">
              <div className="panel-cabeza">
                <h2>{abierto.subject ?? "Mensaje"}</h2>
                <Boton variante="texto" onClick={() => setAbierto(null)}>
                  Cerrar
                </Boton>
              </div>
              <dl className="definiciones">
                <dt>Nombre</dt>
                <dd>{abierto.name}</dd>
                <dt>Correo</dt>
                <dd>
                  <a href={`mailto:${abierto.email}?subject=${encodeURIComponent(`Re: ${abierto.subject ?? "tu mensaje"}`)}`}>{abierto.email}</a>
                </dd>
                {abierto.phone ? (
                  <>
                    <dt>Teléfono</dt>
                    <dd>{abierto.phone}</dd>
                  </>
                ) : null}
                <dt>Recibido</dt>
                <dd>{fecha(abierto.createdAt, true)}</dd>
              </dl>
              <p className="bloque-texto">{abierto.message}</p>
              <div className="acciones-fila">
                {abierto.status !== "ARCHIVED" ? (
                  <Boton variante="borde" onClick={() => void marcar(abierto, "ARCHIVED")}>
                    Archivar
                  </Boton>
                ) : (
                  <Boton variante="borde" onClick={() => void marcar(abierto, "READ")}>
                    Sacar del archivo
                  </Boton>
                )}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
