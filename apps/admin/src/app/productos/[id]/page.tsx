"use client";

import Image from "next/image";
import { use, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, Esqueleto, Icono, cx } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { enviarFormulario } from "@/lib/archivos";
import { STOREFRONT_URL } from "@/lib/env";
import { useSesion } from "@/lib/sesion";
import { Cabecera, Insignia, SubirImagen } from "@/components/base";
import { ConPermiso } from "@/components/marco";
import { ESTADOS_PRODUCTO, TONO_PRODUCTO } from "@/features/catalogo/estados";
import { aApi, CamposProducto, desdeProducto, useGuardar, type DatosProducto, type Producto } from "@/features/catalogo/formulario-producto";

export default function EditarProducto({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <ConPermiso permiso="catalog:read">
      <Editor id={id} />
    </ConPermiso>
  );
}

function Editor({ id }: { id: string }) {
  const qc = useQueryClient();
  const { puede } = useSesion();
  const editable = puede("catalog:manage");
  const clave = ["producto", id];
  const consulta = useQuery({
    queryKey: clave,
    queryFn: async () => (await api.GET("/api/v1/admin/products/{id}", { params: { path: { id } } })).data,
  });
  const p = consulta.data;
  const actualizar = (nuevo: Producto | undefined) => {
    if (nuevo) qc.setQueryData(clave, nuevo);
    void qc.invalidateQueries({ queryKey: ["productos"] });
  };

  if (consulta.isPending) return <Esqueleto alto={480} />;
  if (consulta.error || !p) return <Aviso tono="error">{errorMessage(consulta.error, "No encontramos el producto.")}</Aviso>;

  return (
    <>
      <Cabecera
        titulo={p.name}
        migas={[{ href: "/productos", texto: "Productos" }]}
        acciones={
          p.status === "ACTIVE" ? (
            <a href={`${STOREFRONT_URL}/productos/${p.slug}`} target="_blank" rel="noreferrer" className="boton boton-texto">
              Ver en la tienda
            </a>
          ) : null
        }
      />
      <div className="rejilla-edicion">
        <div className="grupo-campos">
          <Datos key={p.updatedAt} producto={p} editable={editable} onGuardado={actualizar} />
          <Variantes producto={p} editable={editable} onGuardado={actualizar} />
        </div>
        <div className="grupo-campos">
          <Estado producto={p} editable={editable} onGuardado={actualizar} />
          <Fotos producto={p} editable={editable} onGuardado={actualizar} />
        </div>
      </div>
    </>
  );
}

type Props = { producto: Producto; editable: boolean; onGuardado: (p: Producto | undefined) => void };

function Datos({ producto, editable, onGuardado }: Props) {
  const [datos, setDatos] = useState<DatosProducto>(() => desdeProducto(producto));
  const [enviando, setEnviando] = useState(false);
  const { ejecutar, avisos } = useGuardar();

  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnviando(true);
        await ejecutar(async () => {
          const { data } = await api.PATCH("/api/v1/admin/products/{id}", { params: { path: { id: producto.id } }, body: aApi(datos) });
          onGuardado(data);
        });
        setEnviando(false);
      }}
    >
      <h2>Datos de la pieza</h2>
      {avisos}
      <fieldset disabled={!editable} style={{ border: 0, padding: 0, minWidth: 0 }}>
        <CamposProducto datos={datos} onCambio={setDatos} />
      </fieldset>
      {editable ? (
        <Boton type="submit" variante="verde" cargando={enviando}>
          Guardar datos
        </Boton>
      ) : null}
    </form>
  );
}

function Estado({ producto, editable, onGuardado }: Props) {
  const { ejecutar, avisos } = useGuardar();
  const [cargando, setCargando] = useState<string | null>(null);
  const cambiar = async (status: "DRAFT" | "ACTIVE" | "ARCHIVED") => {
    setCargando(status);
    await ejecutar(async () => {
      const { data } = await api.PATCH("/api/v1/admin/products/{id}/status", { params: { path: { id: producto.id } }, body: { status } });
      onGuardado(data);
    });
    setCargando(null);
  };
  const faltan = [
    producto.variants.some((v) => v.isActive) ? null : "una variante activa",
    producto.images.length > 0 ? null : "al menos una foto",
  ].filter(Boolean);

  return (
    <section className="panel" aria-labelledby="t-estado">
      <div className="panel-cabeza">
        <h2 id="t-estado">Publicación</h2>
        <Insignia tono={TONO_PRODUCTO[producto.status]}>{ESTADOS_PRODUCTO[producto.status]}</Insignia>
      </div>
      {avisos}
      {producto.status !== "ACTIVE" && faltan.length > 0 ? <Aviso tono="info">Para publicar falta {faltan.join(" y ")}.</Aviso> : null}
      {editable ? (
        <div className="estado-producto">
          {producto.status !== "ACTIVE" ? (
            <Boton variante="accion" cargando={cargando === "ACTIVE"} disabled={faltan.length > 0} onClick={() => cambiar("ACTIVE")}>
              Publicar en la tienda
            </Boton>
          ) : (
            <Boton variante="borde" cargando={cargando === "DRAFT"} onClick={() => cambiar("DRAFT")}>
              Pasar a borrador
            </Boton>
          )}
          {producto.status !== "ARCHIVED" ? (
            <Boton variante="texto" cargando={cargando === "ARCHIVED"} onClick={() => window.confirm("¿Archivar? Deja de verse en la tienda.") && cambiar("ARCHIVED")}>
              Archivar
            </Boton>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Variantes({ producto, editable, onGuardado }: Props) {
  const { ejecutar, avisos } = useGuardar();
  const [nueva, setNueva] = useState({ name: "", sku: "", price: "", compareAtPrice: "", atributo: "", valor: "" });

  return (
    <section className="panel" aria-labelledby="t-variantes">
      <h2 id="t-variantes">Variantes y precios</h2>
      <p className="campo-ayuda">
        Cada color o tamaño es una variante con su SKU, precio e inventario. Las variantes no se borran (los pedidos las
        recuerdan): se desactivan.
      </p>
      {avisos}
      <div className="variantes">
        {producto.variants.map((v) => (
          <FilaVariante key={`${v.id}:${producto.updatedAt}`} productoId={producto.id} variante={v} editable={editable} ejecutar={ejecutar} onGuardado={onGuardado} />
        ))}
      </div>
      {editable ? (
        <form
          className="variante"
          onSubmit={async (e) => {
            e.preventDefault();
            const ok = await ejecutar(async () => {
              const { data } = await api.POST("/api/v1/admin/products/{id}/variants", {
                params: { path: { id: producto.id } },
                body: {
                  name: nueva.name,
                  sku: nueva.sku.toUpperCase(),
                  price: Number(nueva.price),
                  compareAtPrice: nueva.compareAtPrice ? Number(nueva.compareAtPrice) : null,
                  attributes: (nueva.atributo && nueva.valor ? { [nueva.atributo.toLowerCase()]: nueva.valor } : {}) as never,
                  isActive: true,
                },
              });
              onGuardado(data);
            });
            if (ok) setNueva({ name: "", sku: "", price: "", compareAtPrice: "", atributo: "", valor: "" });
          }}
        >
          <Campo etiqueta="Nueva variante" placeholder="Gris oveja" value={nueva.name} onChange={(e) => setNueva({ ...nueva, name: e.target.value, valor: e.target.value })} required />
          <Campo etiqueta="SKU" value={nueva.sku} onChange={(e) => setNueva({ ...nueva, sku: e.target.value })} required />
          <Campo etiqueta="Precio" type="number" min={0} step={100} value={nueva.price} onChange={(e) => setNueva({ ...nueva, price: e.target.value })} required />
          <Campo etiqueta="Atributo" placeholder="color" value={nueva.atributo} onChange={(e) => setNueva({ ...nueva, atributo: e.target.value })} />
          <span />
          <Boton type="submit" variante="borde">
            Agregar
          </Boton>
        </form>
      ) : null}
    </section>
  );
}

function FilaVariante({
  productoId,
  variante: v,
  editable,
  ejecutar,
  onGuardado,
}: {
  productoId: string;
  variante: Producto["variants"][number];
  editable: boolean;
  ejecutar: (f: () => Promise<unknown>) => Promise<boolean>;
  onGuardado: (p: Producto | undefined) => void;
}) {
  const [d, setD] = useState({ name: v.name, sku: v.sku, price: String(v.price), compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : "" });
  const guardar = (isActive = v.isActive) =>
    ejecutar(async () => {
      const { data } = await api.PATCH("/api/v1/admin/products/{id}/variants/{variantId}", {
        params: { path: { id: productoId, variantId: v.id } },
        body: {
          name: d.name,
          sku: d.sku.toUpperCase(),
          price: Number(d.price),
          compareAtPrice: d.compareAtPrice ? Number(d.compareAtPrice) : null,
          isActive,
        },
      });
      onGuardado(data);
    });
  return (
    <form
      className={cx("variante", !v.isActive && "inactiva")}
      onSubmit={(e) => {
        e.preventDefault();
        void guardar();
      }}
    >
      <fieldset disabled={!editable} style={{ display: "contents" }}>
        <Campo etiqueta="Nombre" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
        <Campo etiqueta="SKU" value={d.sku} onChange={(e) => setD({ ...d, sku: e.target.value })} />
        <Campo etiqueta="Precio" type="number" min={0} step={100} value={d.price} onChange={(e) => setD({ ...d, price: e.target.value })} />
        <Campo etiqueta="Antes" type="number" min={0} step={100} value={d.compareAtPrice} onChange={(e) => setD({ ...d, compareAtPrice: e.target.value })} />
      </fieldset>
      {editable ? (
        <>
          <Boton type="submit" variante="borde">
            Guardar
          </Boton>
          <Boton variante="texto" onClick={() => void guardar(!v.isActive)}>
            {v.isActive ? "Desactivar" : "Activar"}
          </Boton>
        </>
      ) : (
        <Insignia tono={v.isActive ? "verde" : "neutro"}>{v.isActive ? "Activa" : "Inactiva"}</Insignia>
      )}
    </form>
  );
}

function Fotos({ producto, editable, onGuardado }: Props) {
  const { ejecutar, avisos } = useGuardar();
  const fotos = [...producto.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const editar = (imageId: string, body: { altText?: string | null; isPrimary?: boolean; sortOrder?: number; variantId?: string | null }) =>
    ejecutar(async () => {
      const { data } = await api.PATCH("/api/v1/admin/products/{id}/images/{imageId}", {
        params: { path: { id: producto.id, imageId } },
        body,
      });
      onGuardado(data);
    });

  return (
    <section className="panel" aria-labelledby="t-fotos">
      <h2 id="t-fotos">Fotos</h2>
      <p className="campo-ayuda">La principal es la que se ve en el catálogo. Fotos verticales (4:5) se ven mejor.</p>
      {avisos}
      {fotos.length === 0 ? <p>Aún no hay fotos.</p> : null}
      <div className="galeria-admin">
        {fotos.map((f, i) => (
          <div key={f.id} className={cx("foto-admin", f.isPrimary && "principal")}>
            <div className="marco-foto">
              <Image src={f.url} alt={f.altText ?? ""} fill sizes="160px" />
            </div>
            {editable ? (
              <>
                <input
                  aria-label="Texto alternativo"
                  placeholder="Describe la foto"
                  defaultValue={f.altText ?? ""}
                  onBlur={(e) => e.target.value !== (f.altText ?? "") && void editar(f.id, { altText: e.target.value || null })}
                />
                <select
                  aria-label="Variante de la foto"
                  value={f.variantId ?? ""}
                  onChange={(e) => void editar(f.id, { variantId: e.target.value || null })}
                  style={{ minHeight: 32, fontSize: "0.8rem" }}
                >
                  <option value="">Todas las variantes</option>
                  {producto.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <div className="acciones-fila">
                  {f.isPrimary ? (
                    <Insignia tono="lleno">Principal</Insignia>
                  ) : (
                    <Boton variante="texto" onClick={() => void editar(f.id, { isPrimary: true })}>
                      Principal
                    </Boton>
                  )}
                  <Boton variante="texto" disabled={i === 0} aria-label="Mover antes" onClick={() => void editar(f.id, { sortOrder: Math.max(0, f.sortOrder - 1) })}>
                    <Icono nombre="chevron-izq" width={16} height={16} />
                  </Boton>
                  <Boton variante="texto" aria-label="Borrar foto" onClick={() =>
                    window.confirm("¿Borrar esta foto?") &&
                    void ejecutar(async () => {
                      const { data } = await api.DELETE("/api/v1/admin/products/{id}/images/{imageId}", { params: { path: { id: producto.id, imageId: f.id } } });
                      onGuardado(data as Producto | undefined);
                    })
                  }>
                    <Icono nombre="basura" width={16} height={16} />
                  </Boton>
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>
      {editable ? (
        <SubirImagen
          etiqueta="Subir fotos"
          multiple
          onArchivo={async (archivo) => {
            const datos = new FormData();
            datos.append("file", archivo);
            const p = await enviarFormulario<Producto>(`/api/v1/admin/products/${producto.id}/images`, "POST", datos);
            onGuardado(p);
          }}
        />
      ) : null}
    </section>
  );
}
