"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, CampoSelect, CampoTexto, Casilla } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { Cabecera, Insignia, Tabla, fecha } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Testimonio = Schema<"AdminTestimonialResponse">;

export default function Testimonios() {
  return (
    <ConPermiso permiso="content:manage">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<Testimonio | "nuevo" | null>(null);
  const lista = useQuery({ queryKey: ["testimonios"], queryFn: async () => (await api.GET("/api/v1/admin/content/testimonials")).data ?? [] });
  const recargar = async () => {
    await qc.invalidateQueries({ queryKey: ["testimonios"] });
    setEditando(null);
  };

  return (
    <>
      <Cabecera
        titulo="Testimonios"
        acciones={
          <Boton variante="verde" onClick={() => setEditando("nuevo")}>
            Nuevo testimonio
          </Boton>
        }
      >
        <p className="campo-ayuda">Solo opiniones reales de clientes, con su permiso. Los publicados aparecen en el inicio.</p>
      </Cabecera>
      <div className="rejilla-edicion">
        <Tabla
          cargando={lista.isPending}
          error={lista.error}
          filas={lista.data}
          clave={(t) => t.id}
          columnas={[
            {
              titulo: "Cliente",
              celda: (t) => (
                <button type="button" className="boton boton-texto" onClick={() => setEditando(t)} style={{ display: "block", textAlign: "left" }}>
                  {t.customerName}
                  <span className="celda-secundaria">{t.content.slice(0, 70)}{t.content.length > 70 ? "…" : ""}</span>
                </button>
              ),
            },
            { titulo: "Calificación", celda: (t) => (t.rating ? `${t.rating} de 5` : "—") },
            { titulo: "Fecha", celda: (t) => fecha(t.createdAt) },
            { titulo: "Estado", celda: (t) => (t.isPublished ? <Insignia tono="verde">Publicado</Insignia> : <Insignia>Oculto</Insignia>) },
          ]}
        />
        {editando ? (
          <Formulario key={editando === "nuevo" ? "nuevo" : editando.id} t={editando === "nuevo" ? null : editando} onCerrar={() => setEditando(null)} onListo={recargar} />
        ) : null}
      </div>
    </>
  );
}

function Formulario({ t, onCerrar, onListo }: { t: Testimonio | null; onCerrar: () => void; onListo: () => Promise<void> }) {
  const [d, setD] = useState({
    customerName: t?.customerName ?? "",
    location: t?.location ?? "",
    content: t?.content ?? "",
    rating: t?.rating ? String(t.rating) : "",
    isPublished: t?.isPublished ?? false,
    sortOrder: String(t?.sortOrder ?? 0),
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        const body = {
          customerName: d.customerName,
          location: d.location || null,
          content: d.content,
          rating: d.rating ? Number(d.rating) : null,
          isPublished: d.isPublished,
          sortOrder: Number(d.sortOrder) || 0,
        };
        try {
          if (t) await api.PATCH("/api/v1/admin/content/testimonials/{id}", { params: { path: { id: t.id } }, body });
          else await api.POST("/api/v1/admin/content/testimonials", { body });
          await onListo();
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setEnviando(false);
        }
      }}
    >
      <h2>{t ? "Editar testimonio" : "Nuevo testimonio"}</h2>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <div className="fila-2">
        <Campo etiqueta="Nombre del cliente" value={d.customerName} onChange={(e) => setD({ ...d, customerName: e.target.value })} required ayuda="Por ejemplo: Marta R." />
        <Campo etiqueta="Ciudad" value={d.location} onChange={(e) => setD({ ...d, location: e.target.value })} />
      </div>
      <CampoTexto etiqueta="Testimonio" rows={5} maxLength={800} value={d.content} onChange={(e) => setD({ ...d, content: e.target.value })} required />
      <div className="fila-2">
        <CampoSelect etiqueta="Calificación" value={d.rating} onChange={(e) => setD({ ...d, rating: e.target.value })}>
          <option value="">Sin calificación</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} de 5
            </option>
          ))}
        </CampoSelect>
        <Campo etiqueta="Orden" type="number" min={0} value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value })} />
      </div>
      <Casilla checked={d.isPublished} onChange={(e) => setD({ ...d, isPublished: e.target.checked })}>
        Publicado en la tienda
      </Casilla>
      <div className="acciones-fila">
        <Boton type="submit" variante="verde" cargando={enviando}>
          Guardar
        </Boton>
        <Boton variante="texto" onClick={onCerrar}>
          Cerrar
        </Boton>
        {t ? (
          <Boton
            variante="peligro"
            onClick={async () => {
              if (!window.confirm("¿Borrar este testimonio?")) return;
              try {
                await api.DELETE("/api/v1/admin/content/testimonials/{id}", { params: { path: { id: t.id } } });
                await onListo();
              } catch (err) {
                setError(errorMessage(err));
              }
            }}
          >
            Borrar
          </Boton>
        ) : null}
      </div>
    </form>
  );
}
