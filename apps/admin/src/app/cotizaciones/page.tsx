"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, CampoSelect, CampoTexto } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { useSesion } from "@/lib/sesion";
import { Cabecera, FiltroSelect, Insignia, Paginador, Tabla, fecha, useFiltros } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Cotizacion = Schema<"QuoteRequestResponse">;
type Estado = Cotizacion["status"];
type Tipo = Cotizacion["kind"];

const ESTADOS: Record<Estado, string> = { NEW: "Nueva", IN_PROGRESS: "En contacto", QUOTED: "Cotizada", CLOSED: "Cerrada" };
const TONOS: Record<Estado, "ambar" | "verde" | "neutro" | "lleno"> = { NEW: "ambar", IN_PROGRESS: "verde", QUOTED: "lleno", CLOSED: "neutro" };
const TIPOS: Record<Tipo, string> = { EVENT: "Evento", GROUP_VISIT: "Visita de grupo", COURT_RENTAL: "Alquiler de cancha" };

/** La fecha del evento llega como AAAA-MM-DD: se muestra sin pasar por zonas horarias. */
const diaEvento = (d: string) =>
  new Date(`${d}T12:00:00`).toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export default function Cotizaciones() {
  return (
    <ConPermiso permiso="quotes:read">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const qc = useQueryClient();
  const { valores: f, pagina, poner } = useFiltros(["estado", "tipo"] as const);
  const [abierta, setAbierta] = useState<Cotizacion | null>(null);
  const lista = useQuery({
    queryKey: ["cotizaciones", f.estado, f.tipo, pagina],
    queryFn: async () =>
      (
        await api.GET("/api/v1/admin/quotes", {
          params: {
            query: {
              page: pagina,
              pageSize: 25,
              status: (f.estado || undefined) as Estado | undefined,
              kind: (f.tipo || undefined) as Tipo | undefined,
            },
          },
        })
      ).data,
  });

  return (
    <>
      <Cabecera titulo="Cotizaciones">
        <div className="barra-filtros">
          <FiltroSelect etiqueta="Estado" valor={f.estado} opciones={Object.entries(ESTADOS)} onCambio={(estado) => poner({ estado })} />
          <FiltroSelect etiqueta="Tipo" valor={f.tipo} opciones={Object.entries(TIPOS)} onCambio={(tipo) => poner({ tipo })} />
        </div>
      </Cabecera>
      <div className="rejilla-edicion">
        <div className="grupo-campos">
          <Tabla
            cargando={lista.isPending}
            error={lista.error}
            filas={lista.data?.items}
            clave={(c) => c.id}
            vacio="No hay solicitudes con estos filtros."
            columnas={[
              {
                titulo: "Quién",
                celda: (c) => (
                  <button
                    type="button"
                    className="boton boton-texto"
                    style={{ display: "block", textAlign: "left", fontWeight: c.status === "NEW" ? 700 : 400 }}
                    onClick={() => setAbierta(c)}
                  >
                    {c.name}
                    <span className="celda-secundaria">{TIPOS[c.kind]}</span>
                  </button>
                ),
              },
              { titulo: "Para", celda: (c) => (c.eventDate ? diaEvento(c.eventDate) : "Sin fecha") },
              { titulo: "Personas", clase: "num", celda: (c) => c.people ?? "—" },
              { titulo: "Recibida", celda: (c) => fecha(c.createdAt, true) },
              { titulo: "Estado", celda: (c) => <Insignia tono={TONOS[c.status]}>{ESTADOS[c.status]}</Insignia> },
            ]}
          />
          <Paginador pagina={pagina} total={lista.data?.total ?? 0} porPagina={25} onCambio={(p) => poner({ pagina: String(p) })} />
        </div>
        {abierta ? (
          <Detalle
            key={`${abierta.id}:${abierta.updatedAt}`}
            cotizacion={abierta}
            onCerrar={() => setAbierta(null)}
            onGuardada={async (c) => {
              setAbierta(c);
              await qc.invalidateQueries({ queryKey: ["cotizaciones"] });
            }}
          />
        ) : null}
      </div>
    </>
  );
}

function Detalle({ cotizacion: c, onCerrar, onGuardada }: { cotizacion: Cotizacion; onCerrar: () => void; onGuardada: (c: Cotizacion) => Promise<void> }) {
  const { puede } = useSesion();
  const editable = puede("quotes:manage");
  const [estado, setEstado] = useState<Estado>(c.status);
  const [notas, setNotas] = useState(c.adminNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const celular = c.phone.replace(/[^\d+]/g, "");
  const whatsapp = celular.replace(/\D/g, "");

  return (
    <section className="panel" aria-labelledby="t-cotizacion">
      <div className="panel-cabeza">
        <h2 id="t-cotizacion">{TIPOS[c.kind]}</h2>
        <Boton variante="texto" onClick={onCerrar}>
          Cerrar
        </Boton>
      </div>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <dl className="definiciones">
        <dt>Nombre</dt>
        <dd>{c.name}</dd>
        <dt>Celular</dt>
        <dd>
          <a href={`tel:${celular}`}>{c.phone}</a>
          {whatsapp.length >= 10 ? (
            <>
              {" · "}
              <a href={`https://wa.me/${whatsapp.length === 10 ? `57${whatsapp}` : whatsapp}`} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </>
          ) : null}
        </dd>
        <dt>Correo</dt>
        <dd>
          <a href={`mailto:${c.email}?subject=${encodeURIComponent("Tu cotización en Casa Carrillo")}`}>{c.email}</a>
        </dd>
        <dt>Fecha</dt>
        <dd>
          {c.eventDate ? diaEvento(c.eventDate) : "Sin fecha"}
          {c.startTime ? ` · desde las ${c.startTime}` : ""}
          {c.durationHours ? ` · ${c.durationHours} ${c.durationHours === 1 ? "hora" : "horas"}` : ""}
        </dd>
        <dt>Personas</dt>
        <dd>{c.people ?? "Sin indicar"}</dd>
        <dt>Actividades</dt>
        <dd>{c.activityNames.length ? c.activityNames.join(", ") : "Sin indicar"}</dd>
        <dt>Comida</dt>
        <dd>{c.includesFood ? "Sí, quieren comida" : "No"}</dd>
        <dt>Recibida</dt>
        <dd>{fecha(c.createdAt, true)}</dd>
      </dl>
      {c.message ? <p className="bloque-texto">{c.message}</p> : null}

      {editable ? (
        <form
          className="grupo-campos"
          onSubmit={async (e) => {
            e.preventDefault();
            setEnviando(true);
            setError(null);
            try {
              const { data } = await api.PATCH("/api/v1/admin/quotes/{id}", {
                params: { path: { id: c.id } },
                body: { status: estado, adminNotes: notas.trim() || null },
              });
              if (data) await onGuardada(data);
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setEnviando(false);
            }
          }}
        >
          <CampoSelect etiqueta="Estado" value={estado} onChange={(e) => setEstado(e.target.value as Estado)}>
            {Object.entries(ESTADOS).map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </CampoSelect>
          <CampoTexto
            etiqueta="Notas internas"
            rows={4}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            maxLength={2000}
            ayuda="Solo las ve el equipo: valor cotizado, acuerdos, cuándo volver a llamar."
          />
          <Boton type="submit" variante="verde" cargando={enviando}>
            Guardar
          </Boton>
        </form>
      ) : (
        <p className="campo-ayuda">
          Estado: {ESTADOS[c.status]}
          {c.adminNotes ? ` · Notas: ${c.adminNotes}` : ""}
        </p>
      )}
    </section>
  );
}
