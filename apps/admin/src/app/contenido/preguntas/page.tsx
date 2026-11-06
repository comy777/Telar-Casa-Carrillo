"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, CampoTexto, Casilla } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { Cabecera, Insignia, Tabla } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Pregunta = Schema<"AdminFaqResponse">;

export default function Preguntas() {
  return (
    <ConPermiso permiso="content:manage">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<Pregunta | "nueva" | null>(null);
  const lista = useQuery({ queryKey: ["faqs"], queryFn: async () => (await api.GET("/api/v1/admin/content/faqs")).data ?? [] });
  const recargar = async () => {
    await qc.invalidateQueries({ queryKey: ["faqs"] });
    setEditando(null);
  };
  return (
    <>
      <Cabecera
        titulo="Preguntas frecuentes"
        acciones={
          <Boton variante="verde" onClick={() => setEditando("nueva")}>
            Nueva pregunta
          </Boton>
        }
      />
      <div className="rejilla-edicion">
        <Tabla
          cargando={lista.isPending}
          error={lista.error}
          filas={lista.data}
          clave={(f) => f.id}
          columnas={[
            {
              titulo: "Pregunta",
              celda: (f) => (
                <button type="button" className="boton boton-texto" onClick={() => setEditando(f)} style={{ textAlign: "left" }}>
                  {f.question}
                </button>
              ),
            },
            { titulo: "Orden", clase: "num", celda: (f) => f.sortOrder },
            { titulo: "Estado", celda: (f) => (f.isPublished ? <Insignia tono="verde">Publicada</Insignia> : <Insignia>Oculta</Insignia>) },
          ]}
        />
        {editando ? (
          <Formulario key={editando === "nueva" ? "nueva" : editando.id} f={editando === "nueva" ? null : editando} onCerrar={() => setEditando(null)} onListo={recargar} />
        ) : null}
      </div>
    </>
  );
}

function Formulario({ f, onCerrar, onListo }: { f: Pregunta | null; onCerrar: () => void; onListo: () => Promise<void> }) {
  const [d, setD] = useState({ question: f?.question ?? "", answer: f?.answer ?? "", isPublished: f?.isPublished ?? true, sortOrder: String(f?.sortOrder ?? 0) });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        const body = { question: d.question, answer: d.answer, isPublished: d.isPublished, sortOrder: Number(d.sortOrder) || 0 };
        try {
          if (f) await api.PATCH("/api/v1/admin/content/faqs/{id}", { params: { path: { id: f.id } }, body });
          else await api.POST("/api/v1/admin/content/faqs", { body });
          await onListo();
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setEnviando(false);
        }
      }}
    >
      <h2>{f ? "Editar pregunta" : "Nueva pregunta"}</h2>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <Campo etiqueta="Pregunta" value={d.question} onChange={(e) => setD({ ...d, question: e.target.value })} required maxLength={200} />
      <CampoTexto etiqueta="Respuesta" rows={6} value={d.answer} onChange={(e) => setD({ ...d, answer: e.target.value })} required ayuda="Admite listas con - y [enlaces](/envios)." />
      <div className="fila-2">
        <Campo etiqueta="Orden" type="number" min={0} value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value })} />
        <Casilla checked={d.isPublished} onChange={(e) => setD({ ...d, isPublished: e.target.checked })} className="casilla-alineada">
          Publicada
        </Casilla>
      </div>
      <div className="acciones-fila">
        <Boton type="submit" variante="verde" cargando={enviando}>
          Guardar
        </Boton>
        <Boton variante="texto" onClick={onCerrar}>
          Cerrar
        </Boton>
        {f ? (
          <Boton
            variante="peligro"
            onClick={async () => {
              if (!window.confirm("¿Borrar esta pregunta?")) return;
              try {
                await api.DELETE("/api/v1/admin/content/faqs/{id}", { params: { path: { id: f.id } } });
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
