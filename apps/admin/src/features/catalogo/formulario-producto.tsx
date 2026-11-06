"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Aviso, Boton, Campo, CampoSelect, CampoTexto, Casilla } from "@telar/ui";
import type { Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { EntradaChips } from "@/components/chips";
import { aplicarErrorApi } from "@/lib/formularios";

export type Producto = Schema<"AdminProductResponse">;

export interface DatosProducto {
  name: string;
  slug: string;
  sku: string;
  shortDescription: string;
  description: string;
  artisanId: string;
  taxRate: string;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  categoryIds: string[];
  materials: string[];
  techniques: string[];
}

export const vacio: DatosProducto = {
  name: "",
  slug: "",
  sku: "",
  shortDescription: "",
  description: "",
  artisanId: "",
  taxRate: "0.19",
  isFeatured: false,
  seoTitle: "",
  seoDescription: "",
  categoryIds: [],
  materials: [],
  techniques: [],
};

export const desdeProducto = (p: Producto): DatosProducto => ({
  name: p.name,
  slug: p.slug,
  sku: p.sku,
  shortDescription: p.shortDescription ?? "",
  description: p.description,
  artisanId: p.artisanId ?? "",
  taxRate: String(p.taxRate),
  isFeatured: p.isFeatured,
  seoTitle: p.seoTitle ?? "",
  seoDescription: p.seoDescription ?? "",
  categoryIds: p.categoryIds,
  materials: p.materials,
  techniques: p.techniques,
});

/** Cuerpo para la API: vacíos como null, IVA como número. */
export const aApi = (d: DatosProducto) => ({
  name: d.name.trim(),
  slug: d.slug.trim() || undefined,
  sku: d.sku.trim(),
  shortDescription: d.shortDescription.trim() || null,
  description: d.description.trim(),
  artisanId: d.artisanId || null,
  taxRate: Number(d.taxRate),
  isFeatured: d.isFeatured,
  seoTitle: d.seoTitle.trim() || null,
  seoDescription: d.seoDescription.trim() || null,
  categoryIds: d.categoryIds,
  materials: d.materials,
  techniques: d.techniques,
});

const IVA: Array<[string, string]> = [
  ["0.19", "19 % (general)"],
  ["0.05", "5 %"],
  ["0", "0 % (exento o excluido)"],
];

export function CamposProducto({ datos, onCambio }: { datos: DatosProducto; onCambio: (d: DatosProducto) => void }) {
  const categorias = useQuery({ queryKey: ["categorias-admin"], queryFn: async () => (await api.GET("/api/v1/admin/categories")).data ?? [] });
  const artesanos = useQuery({
    queryKey: ["artesanos-todos"],
    queryFn: async () => (await api.GET("/api/v1/admin/artisans", { params: { query: { pageSize: 100 } } })).data?.items ?? [],
  });
  const materiales = useQuery({ queryKey: ["materiales"], queryFn: async () => (await api.GET("/api/v1/catalog/materials")).data ?? [] });
  const tecnicas = useQuery({ queryKey: ["tecnicas"], queryFn: async () => (await api.GET("/api/v1/catalog/techniques")).data ?? [] });
  const set = <K extends keyof DatosProducto>(k: K, v: DatosProducto[K]) => onCambio({ ...datos, [k]: v });
  const porId = new Map((categorias.data ?? []).map((c) => [c.id, c]));
  const nivel = (id: string | null): number => (id && porId.get(id)?.parentId ? 1 + nivel(porId.get(id)!.parentId) : 0);

  return (
    <div className="grupo-campos">
      <Campo etiqueta="Nombre" value={datos.name} onChange={(e) => set("name", e.target.value)} required maxLength={120} />
      <div className="fila-2">
        <Campo etiqueta="SKU" value={datos.sku} onChange={(e) => set("sku", e.target.value.toUpperCase())} required />
        <Campo etiqueta="Slug (URL)" value={datos.slug} onChange={(e) => set("slug", e.target.value)} ayuda="Vacío: se genera del nombre." />
      </div>
      <CampoTexto
        etiqueta="Descripción corta"
        rows={2}
        value={datos.shortDescription}
        onChange={(e) => set("shortDescription", e.target.value)}
        ayuda="Una o dos frases: se muestra en listados y buscadores."
      />
      <CampoTexto
        etiqueta="Descripción"
        rows={7}
        value={datos.description}
        onChange={(e) => set("description", e.target.value)}
        required
        ayuda="Medidas, peso, cuidados. Admite ## títulos, listas con - y **negrita**."
      />
      <div className="fila-2">
        <CampoSelect etiqueta="Tejida por" value={datos.artisanId} onChange={(e) => set("artisanId", e.target.value)}>
          <option value="">Sin asignar</option>
          {(artesanos.data ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
              {a.isActive ? "" : " (inactivo)"}
            </option>
          ))}
        </CampoSelect>
        <CampoSelect etiqueta="IVA" value={datos.taxRate} onChange={(e) => set("taxRate", e.target.value)} ayuda="Confírmalo con el contador.">
          {IVA.map(([v, t]) => (
            <option key={v} value={v}>
              {t}
            </option>
          ))}
        </CampoSelect>
      </div>
      <fieldset className="campo">
        <legend>Categorías</legend>
        <div className="casillas">
          {(categorias.data ?? []).map((c) => (
            <label key={c.id} style={{ paddingLeft: nivel(c.id) * 18 }}>
              <input
                type="checkbox"
                checked={datos.categoryIds.includes(c.id)}
                onChange={(e) =>
                  set("categoryIds", e.target.checked ? [...datos.categoryIds, c.id] : datos.categoryIds.filter((x) => x !== c.id))
                }
              />
              {c.name}
              {c.isActive ? "" : " (inactiva)"}
            </label>
          ))}
        </div>
      </fieldset>
      <EntradaChips etiqueta="Materiales" valores={datos.materials} onCambio={(v) => set("materials", v)} sugerencias={materiales.data ?? []} />
      <EntradaChips etiqueta="Técnicas" valores={datos.techniques} onCambio={(v) => set("techniques", v)} sugerencias={tecnicas.data ?? []} />
      <Casilla checked={datos.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)}>
        Destacado: aparece primero en la pila del inicio
      </Casilla>
      <details>
        <summary>SEO (opcional)</summary>
        <div className="grupo-campos" style={{ marginTop: 12 }}>
          <Campo etiqueta="Título para buscadores" value={datos.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={70} />
          <CampoTexto
            etiqueta="Descripción para buscadores"
            rows={2}
            value={datos.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
            maxLength={160}
          />
        </div>
      </details>
    </div>
  );
}

export function useGuardar() {
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const ejecutar = async (f: () => Promise<unknown>) => {
    setError(null);
    setOk(false);
    try {
      await f();
      setOk(true);
      return true;
    } catch (e) {
      setError(aplicarErrorApi(e, () => undefined, []));
      return false;
    }
  };
  const avisos = (
    <>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      {ok ? <Aviso tono="exito">Cambios guardados.</Aviso> : null}
    </>
  );
  return { ejecutar, avisos, setOk };
}

export { Boton };
