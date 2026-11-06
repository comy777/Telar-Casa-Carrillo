"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, CampoTexto, Casilla, Esqueleto } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { STOREFRONT_URL } from "@/lib/env";
import { Cabecera, Insignia, fecha } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Pagina = Schema<"AdminPageResponse">;

/** Páginas que la tienda enlaza desde el pie y el checkout: deben existir y estar publicadas. */
const REQUERIDAS: Array<[string, string]> = [
  ["terminos-y-condiciones", "Términos y condiciones"],
  ["tratamiento-de-datos", "Política de tratamiento de datos"],
  ["derecho-de-retracto", "Derecho de retracto"],
  ["garantias", "Garantías"],
  ["envios", "Envíos"],
  ["cambios-y-devoluciones", "Cambios y devoluciones"],
];

export default function Paginas() {
  return (
    <ConPermiso permiso="content:manage">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const qc = useQueryClient();
  const lista = useQuery({ queryKey: ["paginas"], queryFn: async () => (await api.GET("/api/v1/admin/content/pages")).data ?? [] });
  const [editando, setEditando] = useState<Pagina | { slug: string; title: string } | null>(null);
  const existentes = new Map((lista.data ?? []).map((p) => [p.slug, p]));
  const faltan = REQUERIDAS.filter(([s]) => !existentes.get(s)?.isPublished);

  return (
    <>
      <Cabecera
        titulo="Páginas"
        acciones={
          <Boton variante="verde" onClick={() => setEditando({ slug: "", title: "" })}>
            Nueva página
          </Boton>
        }
      />
      {faltan.length > 0 ? (
        <Aviso tono="info">
          La tienda enlaza estas páginas y aún no están publicadas: {faltan.map(([, t]) => t).join(", ")}. Los textos legales los debe
          revisar el negocio (Ley 1581 y Ley 1480).
        </Aviso>
      ) : null}
      <div className="rejilla-edicion">
        <section className="panel">
          {lista.isPending ? (
            <Esqueleto alto={200} />
          ) : (
            <ul className="lista-simple">
              {REQUERIDAS.map(([slug, titulo]) => {
                const p = existentes.get(slug);
                return (
                  <li key={slug}>
                    <button type="button" className="boton boton-texto" onClick={() => setEditando(p ?? { slug, title: titulo })}>
                      {p?.title ?? titulo}
                    </button>
                    {p ? (p.isPublished ? <Insignia tono="verde">Publicada</Insignia> : <Insignia tono="ambar">Borrador</Insignia>) : <Insignia tono="rojo">Falta</Insignia>}
                  </li>
                );
              })}
              {(lista.data ?? [])
                .filter((p) => !REQUERIDAS.some(([s]) => s === p.slug))
                .map((p) => (
                  <li key={p.id}>
                    <button type="button" className="boton boton-texto" onClick={() => setEditando(p)}>
                      {p.title}
                    </button>
                    {p.isPublished ? <Insignia tono="verde">Publicada</Insignia> : <Insignia tono="ambar">Borrador</Insignia>}
                  </li>
                ))}
            </ul>
          )}
        </section>
        {editando ? (
          <Editor
            key={"id" in editando ? editando.id : `nueva-${editando.slug}`}
            pagina={editando}
            onCerrar={() => setEditando(null)}
            onGuardado={async (p) => {
              await qc.invalidateQueries({ queryKey: ["paginas"] });
              setEditando(p);
            }}
          />
        ) : null}
      </div>
    </>
  );
}

function Editor({
  pagina,
  onCerrar,
  onGuardado,
}: {
  pagina: Pagina | { slug: string; title: string };
  onCerrar: () => void;
  onGuardado: (p: Pagina | null) => Promise<void>;
}) {
  const existente = "id" in pagina ? pagina : null;
  const [d, setD] = useState({
    slug: pagina.slug,
    title: pagina.title,
    body: existente?.body ?? "",
    isPublished: existente?.isPublished ?? false,
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
        try {
          const { data } = existente
            ? await api.PATCH("/api/v1/admin/content/pages/{id}", { params: { path: { id: existente.id } }, body: d })
            : await api.POST("/api/v1/admin/content/pages", { body: d });
          await onGuardado(data ?? null);
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setEnviando(false);
        }
      }}
    >
      <div className="panel-cabeza">
        <h2>{existente ? d.title : "Nueva página"}</h2>
        {existente?.isPublished ? (
          <a href={`${STOREFRONT_URL}/${existente.slug}`} target="_blank" rel="noreferrer">
            Ver en la tienda
          </a>
        ) : null}
      </div>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <div className="fila-2">
        <Campo etiqueta="Título" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} required />
        <Campo etiqueta="Dirección (slug)" value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} required ayuda="Minúsculas y guiones: nosotros, envios…" />
      </div>
      <CampoTexto
        etiqueta="Contenido"
        className="campo-editor"
        rows={18}
        value={d.body}
        onChange={(e) => setD({ ...d, body: e.target.value })}
        required
        ayuda="## Título de sección · párrafos separados por una línea en blanco · listas con - · **negrita** · [enlace](/contacto)"
      />
      <Casilla checked={d.isPublished} onChange={(e) => setD({ ...d, isPublished: e.target.checked })}>
        Publicada
      </Casilla>
      {existente ? <p className="campo-ayuda">Última edición: {fecha(existente.updatedAt, true)}</p> : null}
      <div className="acciones-fila">
        <Boton type="submit" variante="verde" cargando={enviando}>
          Guardar
        </Boton>
        <Boton variante="texto" onClick={onCerrar}>
          Cerrar
        </Boton>
      </div>
    </form>
  );
}
