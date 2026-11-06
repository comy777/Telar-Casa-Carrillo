"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, CampoTexto, Casilla } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { enviarFormulario } from "@/lib/archivos";
import { useSesion } from "@/lib/sesion";
import { Buscador, Cabecera, Insignia, Paginador, SubirImagen, Tabla, useFiltros } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Artesano = Schema<"AdminArtisanResponse">;

export default function Artesanos() {
  return (
    <ConPermiso permiso="catalog:read">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const qc = useQueryClient();
  const { puede } = useSesion();
  const editable = puede("catalog:manage");
  const { valores: f, pagina, poner } = useFiltros(["q"] as const);
  const [editando, setEditando] = useState<Artesano | "nuevo" | null>(null);
  const lista = useQuery({
    queryKey: ["artesanos", f.q, pagina],
    queryFn: async () =>
      (await api.GET("/api/v1/admin/artisans", { params: { query: { page: pagina, pageSize: 20, search: f.q || undefined } } })).data,
  });
  const recargar = async () => {
    await qc.invalidateQueries({ queryKey: ["artesanos"] });
    await qc.invalidateQueries({ queryKey: ["artesanos-todos"] });
  };

  return (
    <>
      <Cabecera
        titulo="Artesanos"
        acciones={
          editable ? (
            <Boton variante="verde" onClick={() => setEditando("nuevo")}>
              Nuevo artesano
            </Boton>
          ) : null
        }
      >
        <div className="barra-filtros">
          <Buscador valor={f.q} onBuscar={(q) => poner({ q })} etiqueta="Buscar por nombre" />
        </div>
      </Cabecera>
      <div className="rejilla-edicion">
        <div className="grupo-campos">
          <Tabla
            cargando={lista.isPending}
            error={lista.error}
            filas={lista.data?.items}
            clave={(a) => a.id}
            columnas={[
              {
                titulo: "Artesano",
                celda: (a) => (
                  <button type="button" className="boton boton-texto" onClick={() => setEditando(a)} style={{ gap: 10 }}>
                    <span className="celda-foto">{a.photoUrl ? <Image src={a.photoUrl} alt="" fill sizes="44px" /> : null}</span>
                    {a.name}
                  </button>
                ),
              },
              { titulo: "Estado", celda: (a) => (a.isActive ? <Insignia tono="verde">Visible</Insignia> : <Insignia>Oculto</Insignia>) },
              { titulo: "Destacado", celda: (a) => (a.isFeatured ? "Sí" : "") },
            ]}
          />
          <Paginador pagina={pagina} total={lista.data?.total ?? 0} porPagina={20} onCambio={(p) => poner({ pagina: String(p) })} />
        </div>
        {editando ? (
          <FormularioArtesano
            key={editando === "nuevo" ? "nuevo" : editando.id}
            artesano={editando === "nuevo" ? null : editando}
            editable={editable}
            onCerrar={() => setEditando(null)}
            onGuardado={async (a) => {
              await recargar();
              setEditando(a);
            }}
          />
        ) : null}
      </div>
    </>
  );
}

function FormularioArtesano({
  artesano,
  editable,
  onCerrar,
  onGuardado,
}: {
  artesano: Artesano | null;
  editable: boolean;
  onCerrar: () => void;
  onGuardado: (a: Artesano) => Promise<void>;
}) {
  const [d, setD] = useState({
    name: artesano?.name ?? "",
    slug: artesano?.slug ?? "",
    biography: artesano?.biography ?? "",
    story: artesano?.story ?? "",
    isFeatured: artesano?.isFeatured ?? false,
    isActive: artesano?.isActive ?? true,
  });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        const body = { ...d, slug: d.slug || undefined, biography: d.biography || null, story: d.story || null };
        try {
          const { data } = artesano
            ? await api.PATCH("/api/v1/admin/artisans/{id}", { params: { path: { id: artesano.id } }, body })
            : await api.POST("/api/v1/admin/artisans", { body });
          if (data) await onGuardado(data);
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setEnviando(false);
        }
      }}
    >
      <h2>{artesano ? artesano.name : "Nuevo artesano"}</h2>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <fieldset disabled={!editable} style={{ border: 0, padding: 0, display: "grid", gap: 14, minWidth: 0 }}>
        <Campo etiqueta="Nombre" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} required />
        <Campo etiqueta="Slug" value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} ayuda="Vacío: se genera del nombre." />
        <CampoTexto
          etiqueta="Biografía corta"
          rows={3}
          value={d.biography}
          onChange={(e) => setD({ ...d, biography: e.target.value })}
          ayuda="Una o dos frases: se ve en la ficha de cada pieza."
        />
        <CampoTexto etiqueta="Historia" rows={8} value={d.story} onChange={(e) => setD({ ...d, story: e.target.value })} ayuda="Admite ## títulos y párrafos." />
        <Casilla checked={d.isFeatured} onChange={(e) => setD({ ...d, isFeatured: e.target.checked })}>
          Destacado en el inicio
        </Casilla>
        <Casilla checked={d.isActive} onChange={(e) => setD({ ...d, isActive: e.target.checked })}>
          Visible en la tienda
        </Casilla>
      </fieldset>
      <div className="acciones-fila">
        {editable ? (
          <Boton type="submit" variante="verde" cargando={enviando}>
            Guardar
          </Boton>
        ) : null}
        <Boton variante="texto" onClick={onCerrar}>
          Cerrar
        </Boton>
      </div>
      {artesano && editable ? (
        <div className="grupo-campos">
          <h3>Retrato</h3>
          {artesano.photoUrl ? (
            <div className="foto-admin" style={{ maxWidth: 200 }}>
              <div className="marco-foto">
                <Image src={artesano.photoUrl} alt={artesano.name} fill sizes="200px" />
              </div>
            </div>
          ) : null}
          <SubirImagen
            etiqueta={artesano.photoUrl ? "Cambiar retrato" : "Subir retrato"}
            onArchivo={async (f) => {
              const datos = new FormData();
              datos.append("file", f);
              await onGuardado(await enviarFormulario<Artesano>(`/api/v1/admin/artisans/${artesano.id}/photo`, "PUT", datos));
            }}
          />
        </div>
      ) : null}
    </form>
  );
}
