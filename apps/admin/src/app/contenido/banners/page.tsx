"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, Casilla } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { enviarFormulario, TIPOS_IMAGEN, validarImagen } from "@/lib/archivos";
import { Cabecera, Insignia, SubirImagen, Tabla, fecha } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Banner = Schema<"AdminBannerResponse">;

export default function Banners() {
  return (
    <ConPermiso permiso="content:manage">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<Banner | "nuevo" | null>(null);
  const lista = useQuery({ queryKey: ["banners"], queryFn: async () => (await api.GET("/api/v1/admin/content/banners")).data ?? [] });
  const recargar = () => qc.invalidateQueries({ queryKey: ["banners"] });

  return (
    <>
      <Cabecera
        titulo="Banners"
        acciones={
          <Boton variante="verde" onClick={() => setEditando("nuevo")}>
            Nuevo banner
          </Boton>
        }
      >
        <p className="campo-ayuda">El primer banner vigente aparece en el inicio, debajo de la pila de piezas.</p>
      </Cabecera>
      <div className="rejilla-edicion">
        <Tabla
          cargando={lista.isPending}
          error={lista.error}
          filas={lista.data}
          clave={(b) => b.id}
          columnas={[
            {
              titulo: "Banner",
              celda: (b) => (
                <button type="button" className="boton boton-texto" onClick={() => setEditando(b)} style={{ gap: 10 }}>
                  <span className="celda-foto">
                    <Image src={b.imageUrl} alt="" fill sizes="44px" />
                  </span>
                  {b.title}
                </button>
              ),
            },
            { titulo: "Vigencia", celda: (b) => (b.startsAt || b.endsAt ? `${fecha(b.startsAt)} – ${fecha(b.endsAt)}` : "Siempre") },
            { titulo: "Orden", clase: "num", celda: (b) => b.sortOrder },
            { titulo: "Estado", celda: (b) => (b.isActive ? <Insignia tono="verde">Activo</Insignia> : <Insignia>Inactivo</Insignia>) },
          ]}
        />
        {editando ? (
          <Formulario
            key={editando === "nuevo" ? "nuevo" : editando.id}
            banner={editando === "nuevo" ? null : editando}
            onCerrar={() => setEditando(null)}
            onGuardado={async (b) => {
              await recargar();
              setEditando(b);
            }}
            onBorrado={async () => {
              await recargar();
              setEditando(null);
            }}
          />
        ) : null}
      </div>
    </>
  );
}

const aFecha = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

function Formulario({
  banner,
  onCerrar,
  onGuardado,
  onBorrado,
}: {
  banner: Banner | null;
  onCerrar: () => void;
  onGuardado: (b: Banner | null) => Promise<void>;
  onBorrado: () => Promise<void>;
}) {
  const [d, setD] = useState({
    title: banner?.title ?? "",
    subtitle: banner?.subtitle ?? "",
    imageAlt: banner?.imageAlt ?? "",
    targetUrl: banner?.targetUrl ?? "",
    ctaLabel: banner?.ctaLabel ?? "",
    startsAt: aFecha(banner?.startsAt ?? null),
    endsAt: aFecha(banner?.endsAt ?? null),
    sortOrder: String(banner?.sortOrder ?? 0),
    isActive: banner?.isActive ?? true,
  });
  const archivo = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const campos = () => ({
    title: d.title,
    subtitle: d.subtitle || null,
    imageAlt: d.imageAlt || null,
    targetUrl: d.targetUrl || null,
    ctaLabel: d.ctaLabel || null,
    startsAt: d.startsAt ? `${d.startsAt}T00:00:00-05:00` : null,
    endsAt: d.endsAt ? `${d.endsAt}T23:59:59-05:00` : null,
    sortOrder: Number(d.sortOrder) || 0,
    isActive: d.isActive,
  });

  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        try {
          if (banner) {
            const { data } = await api.PATCH("/api/v1/admin/content/banners/{id}", { params: { path: { id: banner.id } }, body: campos() as never });
            await onGuardado(data ?? null);
          } else {
            const f = archivo.current?.files?.[0];
            if (!f) throw new Error("Elige la foto del banner.");
            const problema = validarImagen(f);
            if (problema) throw new Error(problema);
            const datos = new FormData();
            for (const [k, v] of Object.entries(campos())) if (v !== null && v !== "") datos.append(k, String(v));
            datos.append("file", f);
            await onGuardado(await enviarFormulario<Banner>("/api/v1/admin/content/banners", "POST", datos));
          }
        } catch (err) {
          setError(err instanceof Error && !("status" in err) ? err.message : errorMessage(err));
        } finally {
          setEnviando(false);
        }
      }}
    >
      <h2>{banner ? banner.title : "Nuevo banner"}</h2>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      {banner ? (
        <>
          <div className="foto-admin" style={{ maxWidth: 320 }}>
            <div className="marco-foto" style={{ aspectRatio: "16 / 9" }}>
              <Image src={banner.imageUrl} alt={banner.imageAlt ?? ""} fill sizes="320px" />
            </div>
          </div>
          <SubirImagen
            etiqueta="Cambiar foto"
            onArchivo={async (f) => {
              const datos = new FormData();
              datos.append("file", f);
              await onGuardado(await enviarFormulario<Banner>(`/api/v1/admin/content/banners/${banner.id}/image`, "PUT", datos));
            }}
          />
        </>
      ) : (
        <div className="campo">
          <label htmlFor="foto-banner">Foto (horizontal, JPEG, PNG o WebP, hasta 5 MB)</label>
          <input id="foto-banner" ref={archivo} type="file" accept={TIPOS_IMAGEN} required />
        </div>
      )}
      <Campo etiqueta="Título" value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} required maxLength={120} />
      <Campo etiqueta="Subtítulo" value={d.subtitle} onChange={(e) => setD({ ...d, subtitle: e.target.value })} maxLength={240} />
      <Campo etiqueta="Texto alternativo de la foto" value={d.imageAlt} onChange={(e) => setD({ ...d, imageAlt: e.target.value })} ayuda="Describe la foto para quien no la ve." />
      <div className="fila-2">
        <Campo etiqueta="Enlace" placeholder="/categorias/ruanas" value={d.targetUrl} onChange={(e) => setD({ ...d, targetUrl: e.target.value })} ayuda="Ruta de la tienda o https://" />
        <Campo etiqueta="Texto del botón" placeholder="Ver ruanas" value={d.ctaLabel} onChange={(e) => setD({ ...d, ctaLabel: e.target.value })} />
      </div>
      <div className="fila-3">
        <Campo etiqueta="Desde" type="date" value={d.startsAt} onChange={(e) => setD({ ...d, startsAt: e.target.value })} />
        <Campo etiqueta="Hasta" type="date" value={d.endsAt} onChange={(e) => setD({ ...d, endsAt: e.target.value })} />
        <Campo etiqueta="Orden" type="number" min={0} value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value })} />
      </div>
      <Casilla checked={d.isActive} onChange={(e) => setD({ ...d, isActive: e.target.checked })}>
        Activo
      </Casilla>
      <div className="acciones-fila">
        <Boton type="submit" variante="verde" cargando={enviando}>
          {banner ? "Guardar" : "Crear banner"}
        </Boton>
        <Boton variante="texto" onClick={onCerrar}>
          Cerrar
        </Boton>
        {banner ? (
          <Boton
            variante="peligro"
            onClick={async () => {
              if (!window.confirm("¿Borrar este banner?")) return;
              try {
                await api.DELETE("/api/v1/admin/content/banners/{id}", { params: { path: { id: banner.id } } });
                await onBorrado();
              } catch (e) {
                setError(errorMessage(e));
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
