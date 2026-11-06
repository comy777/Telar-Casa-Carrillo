"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { claseBoton, formatoPesos } from "@telar/ui";
import { api } from "@/lib/api-browser";
import { Buscador, Cabecera, FiltroSelect, Insignia, Paginador, Tabla, fecha, useFiltros } from "@/components/base";
import { ConPermiso } from "@/components/marco";
import { useSesion } from "@/lib/sesion";
import { ESTADOS_PRODUCTO, TONO_PRODUCTO } from "@/features/catalogo/estados";

const POR_PAGINA = 20;

export default function Productos() {
  return (
    <ConPermiso permiso="catalog:read">
      <Lista />
    </ConPermiso>
  );
}

function Lista() {
  const { puede } = useSesion();
  const { valores: f, pagina, poner } = useFiltros(["q", "estado", "categoria", "artesano"] as const);
  const categorias = useQuery({ queryKey: ["categorias-admin"], queryFn: async () => (await api.GET("/api/v1/admin/categories")).data ?? [] });
  const artesanos = useQuery({
    queryKey: ["artesanos-todos"],
    queryFn: async () => (await api.GET("/api/v1/admin/artisans", { params: { query: { pageSize: 100 } } })).data?.items ?? [],
  });
  const lista = useQuery({
    queryKey: ["productos", f, pagina],
    queryFn: async () =>
      (
        await api.GET("/api/v1/admin/products", {
          params: {
            query: {
              page: pagina,
              pageSize: POR_PAGINA,
              search: f.q || undefined,
              status: (f.estado || undefined) as "DRAFT" | "ACTIVE" | "ARCHIVED" | undefined,
              categoryId: f.categoria || undefined,
              artisanId: f.artesano || undefined,
            },
          },
        })
      ).data,
  });

  return (
    <>
      <Cabecera
        titulo="Productos"
        acciones={
          puede("catalog:manage") ? (
            <Link href="/productos/nuevo" className={claseBoton("verde")}>
              Nuevo producto
            </Link>
          ) : null
        }
      >
        <div className="barra-filtros">
          <Buscador valor={f.q} onBuscar={(q) => poner({ q })} etiqueta="Buscar por nombre o SKU" />
          <FiltroSelect etiqueta="Estado" valor={f.estado} opciones={Object.entries(ESTADOS_PRODUCTO)} onCambio={(estado) => poner({ estado })} />
          <FiltroSelect etiqueta="Categoría" valor={f.categoria} opciones={(categorias.data ?? []).map((c) => [c.id, c.name])} onCambio={(categoria) => poner({ categoria })} />
          <FiltroSelect etiqueta="Artesano" valor={f.artesano} opciones={(artesanos.data ?? []).map((a) => [a.id, a.name])} onCambio={(artesano) => poner({ artesano })} />
        </div>
      </Cabecera>

      <Tabla
        cargando={lista.isPending}
        error={lista.error}
        filas={lista.data?.items}
        clave={(p) => p.id}
        enlace={(p) => `/productos/${p.id}`}
        columnas={[
          {
            titulo: "Producto",
            celda: (p) => {
              const foto = p.images.find((i) => i.isPrimary) ?? p.images[0];
              return (
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span className="celda-foto">{foto ? <Image src={foto.url} alt="" fill sizes="44px" /> : null}</span>
                  <span>
                    {p.name}
                    <span className="celda-secundaria">{p.sku}</span>
                  </span>
                </span>
              );
            },
          },
          { titulo: "Estado", celda: (p) => <Insignia tono={TONO_PRODUCTO[p.status]}>{ESTADOS_PRODUCTO[p.status]}</Insignia> },
          {
            titulo: "Precio",
            clase: "num",
            celda: (p) => {
              const activos = p.variants.filter((v) => v.isActive);
              const min = Math.min(...activos.map((v) => v.price));
              return activos.length ? `${activos.length > 1 ? "Desde " : ""}${formatoPesos(min)}` : "—";
            },
          },
          { titulo: "Variantes", clase: "num", celda: (p) => `${p.variants.filter((v) => v.isActive).length}/${p.variants.length}` },
          { titulo: "Destacado", celda: (p) => (p.isFeatured ? "Sí" : "") },
          { titulo: "Actualizado", celda: (p) => fecha(p.updatedAt) },
        ]}
      />
      <Paginador pagina={pagina} total={lista.data?.total ?? 0} porPagina={POR_PAGINA} onCambio={(p) => poner({ pagina: String(p) })} />
    </>
  );
}
