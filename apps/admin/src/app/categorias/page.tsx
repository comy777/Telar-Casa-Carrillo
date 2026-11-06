"use client";

import Image from "next/image";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, CampoSelect, CampoTexto, Casilla, Esqueleto } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { enviarFormulario } from "@/lib/archivos";
import { useSesion } from "@/lib/sesion";
import { Cabecera, Insignia, SubirImagen } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Categoria = Schema<"AdminCategoryResponse">;
const CLAVE = ["categorias-admin"];

export default function Categorias() {
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
  const lista = useQuery({ queryKey: CLAVE, queryFn: async () => (await api.GET("/api/v1/admin/categories")).data ?? [] });
  const [editando, setEditando] = useState<Categoria | "nueva" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recargar = () => qc.invalidateQueries({ queryKey: CLAVE });

  // Árbol en orden: raíz y luego sus hijas, con su nivel.
  const todas = lista.data ?? [];
  const ordenar = (padre: string | null, nivel: number): Array<Categoria & { nivel: number }> =>
    todas
      .filter((c) => c.parentId === padre)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es"))
      .flatMap((c) => [{ ...c, nivel }, ...ordenar(c.id, nivel + 1)]);
  const arbol = ordenar(null, 0);

  return (
    <>
      <Cabecera
        titulo="Categorías"
        acciones={
          editable ? (
            <Boton variante="verde" onClick={() => setEditando("nueva")}>
              Nueva categoría
            </Boton>
          ) : null
        }
      />
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <div className="rejilla-edicion">
        <section className="panel">
          {lista.isPending ? (
            <Esqueleto alto={240} />
          ) : arbol.length === 0 ? (
            <p>Aún no hay categorías. Crea Ruanas, Prendas y Hamacas para empezar.</p>
          ) : (
            <ul className="lista-simple">
              {arbol.map((c) => (
                <li key={c.id}>
                  <span style={{ paddingLeft: c.nivel * 22, display: "flex", gap: 10, alignItems: "center" }}>
                    <span className="celda-foto" style={{ width: 36, height: 36 }}>
                      {c.imageUrl ? <Image src={c.imageUrl} alt="" fill sizes="36px" /> : null}
                    </span>
                    <button type="button" className="boton-texto boton" onClick={() => setEditando(c)} disabled={!editable}>
                      {c.name}
                    </button>
                    {!c.isActive ? <Insignia>Oculta</Insignia> : null}
                  </span>
                  <span className="celda-secundaria">/{c.slug}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        {editando ? (
          <FormularioCategoria
            key={editando === "nueva" ? "nueva" : editando.id}
            categoria={editando === "nueva" ? null : editando}
            todas={todas}
            onCerrar={() => setEditando(null)}
            onGuardado={async (c) => {
              await recargar();
              setEditando(c);
            }}
            onBorrar={async (c) => {
              if (!window.confirm(`¿Borrar «${c.name}»? Solo se puede si no tiene subcategorías ni productos.`)) return;
              setError(null);
              try {
                await api.DELETE("/api/v1/admin/categories/{id}", { params: { path: { id: c.id } } });
                setEditando(null);
                await recargar();
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          />
        ) : null}
      </div>
    </>
  );
}

function FormularioCategoria({
  categoria,
  todas,
  onCerrar,
  onGuardado,
  onBorrar,
}: {
  categoria: Categoria | null;
  todas: Categoria[];
  onCerrar: () => void;
  onGuardado: (c: Categoria) => Promise<void>;
  onBorrar: (c: Categoria) => Promise<void>;
}) {
  const [d, setD] = useState({
    name: categoria?.name ?? "",
    slug: categoria?.slug ?? "",
    description: categoria?.description ?? "",
    parentId: categoria?.parentId ?? "",
    isActive: categoria?.isActive ?? true,
    sortOrder: String(categoria?.sortOrder ?? 0),
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
        const body = {
          name: d.name,
          slug: d.slug || undefined,
          description: d.description || null,
          parentId: d.parentId || null,
          isActive: d.isActive,
          sortOrder: Number(d.sortOrder) || 0,
        };
        try {
          const { data } = categoria
            ? await api.PATCH("/api/v1/admin/categories/{id}", { params: { path: { id: categoria.id } }, body })
            : await api.POST("/api/v1/admin/categories", { body });
          if (data) await onGuardado(data);
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setEnviando(false);
        }
      }}
    >
      <h2>{categoria ? `Editar «${categoria.name}»` : "Nueva categoría"}</h2>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <Campo etiqueta="Nombre" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} required />
      <Campo etiqueta="Slug" value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} ayuda="Vacío: se genera del nombre." />
      <CampoTexto etiqueta="Descripción" rows={3} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
      <CampoSelect etiqueta="Dentro de" value={d.parentId} onChange={(e) => setD({ ...d, parentId: e.target.value })}>
        <option value="">Ninguna (categoría principal)</option>
        {todas
          .filter((c) => c.id !== categoria?.id)
          .map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
      </CampoSelect>
      <div className="fila-2">
        <Campo etiqueta="Orden" type="number" min={0} value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value })} />
        <Casilla checked={d.isActive} onChange={(e) => setD({ ...d, isActive: e.target.checked })} className="casilla-alineada">
          Visible en la tienda
        </Casilla>
      </div>
      <div className="acciones-fila">
        <Boton type="submit" variante="verde" cargando={enviando}>
          Guardar
        </Boton>
        <Boton variante="texto" onClick={onCerrar}>
          Cerrar
        </Boton>
        {categoria ? (
          <Boton variante="peligro" onClick={() => void onBorrar(categoria)}>
            Borrar
          </Boton>
        ) : null}
      </div>
      {categoria ? (
        <div className="grupo-campos">
          <h3>Imagen</h3>
          {categoria.imageUrl ? (
            <div className="foto-admin" style={{ maxWidth: 200 }}>
              <div className="marco-foto">
                <Image src={categoria.imageUrl} alt="" fill sizes="200px" />
              </div>
            </div>
          ) : null}
          <SubirImagen
            etiqueta={categoria.imageUrl ? "Cambiar imagen" : "Subir imagen"}
            onArchivo={async (f) => {
              const datos = new FormData();
              datos.append("file", f);
              await onGuardado(await enviarFormulario<Categoria>(`/api/v1/admin/categories/${categoria.id}/image`, "PUT", datos));
            }}
          />
        </div>
      ) : null}
    </form>
  );
}
