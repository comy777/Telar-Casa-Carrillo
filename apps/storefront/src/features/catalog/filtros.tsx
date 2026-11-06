"use client";

import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Icono } from "@telar/ui";
import { ORDENES, urlCatalogo, type FiltrosUrl } from "./busqueda";

interface Opcion {
  valor: string;
  texto: string;
  nivel?: number;
}

/**
 * Filtros del catálogo. Es un <form method="get">: funciona sin JavaScript; con JavaScript
 * aplica cada cambio al instante sin recargar la página.
 */
export function Filtros({
  filtros,
  categorias,
  tejedores,
  tecnicas,
  ocultarCategoria = false,
}: {
  filtros: FiltrosUrl;
  categorias: Opcion[];
  tejedores: Opcion[];
  tecnicas: Opcion[];
  ocultarCategoria?: boolean;
}) {
  const router = useRouter();
  const ruta = usePathname();
  const form = useRef<HTMLFormElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [pendiente, startTransition] = useTransition();

  const aplicar = () => {
    if (!form.current) return;
    const datos = new FormData(form.current);
    const nuevos: FiltrosUrl = {};
    for (const [k, v] of datos.entries()) if (typeof v === "string" && v.trim()) (nuevos as Record<string, string>)[k] = v.trim();
    if (filtros.q && !("q" in nuevos)) nuevos.q = filtros.q;
    startTransition(() => router.replace(urlCatalogo(ruta, {}, nuevos), { scroll: false }));
  };

  const hayFiltros = Boolean(filtros.categoria || filtros.tejedor || filtros.tecnica || filtros.min || filtros.max || filtros.disponibles);

  return (
    <>
      <div className="barra-filtros-movil">
        <button
          type="button"
          className="boton boton-borde filtros-movil"
          aria-expanded={abierto}
          aria-controls="filtros"
          onClick={() => setAbierto((v) => !v)}
        >
          {abierto ? "Ocultar filtros" : "Filtrar"}
        </button>
      </div>
      <form
        ref={form}
        id="filtros"
        className={abierto ? "filtros abierto" : "filtros"}
        aria-label="Filtros del catálogo"
        method="get"
        action={ruta}
        aria-busy={pendiente || undefined}
        onChange={(e) => {
          const el = e.target as unknown as HTMLInputElement;
          if (el.type === "number") return; // los precios se aplican al salir del campo
          aplicar();
        }}
        onSubmit={(e) => {
          e.preventDefault();
          aplicar();
        }}
      >
        {filtros.q ? <input type="hidden" name="q" value={filtros.q} /> : null}

        <div className="campo">
          <label htmlFor="orden">Ordenar por</label>
          <select id="orden" name="orden" defaultValue={filtros.orden ?? (filtros.q ? "relevance" : "newest")}>
            {ORDENES.filter((o) => o.valor !== "relevance" || filtros.q).map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.texto}
              </option>
            ))}
          </select>
        </div>

        {!ocultarCategoria && categorias.length > 0 ? (
          <fieldset>
            <legend>Categoría</legend>
            <label>
              <input type="radio" name="categoria" value="" defaultChecked={!filtros.categoria} /> Todas
            </label>
            {categorias.map((c) => (
              <label key={c.valor} style={c.nivel ? { paddingLeft: c.nivel * 18 } : undefined}>
                <input type="radio" name="categoria" value={c.valor} defaultChecked={filtros.categoria === c.valor} /> {c.texto}
              </label>
            ))}
          </fieldset>
        ) : null}

        <fieldset>
          <legend>Precio</legend>
          <div className="rango">
            <div className="campo">
              <label htmlFor="min">Desde</label>
              <input id="min" name="min" type="number" inputMode="numeric" min={0} step={1000} placeholder="$ 0" defaultValue={filtros.min} onBlur={aplicar} />
            </div>
            <div className="campo">
              <label htmlFor="max">Hasta</label>
              <input id="max" name="max" type="number" inputMode="numeric" min={0} step={1000} placeholder="Sin tope" defaultValue={filtros.max} onBlur={aplicar} />
            </div>
          </div>
        </fieldset>

        <fieldset>
          <legend>Disponibilidad</legend>
          <label>
            <input type="checkbox" name="disponibles" value="1" defaultChecked={filtros.disponibles === "1"} /> Solo piezas disponibles
          </label>
        </fieldset>

        {tejedores.length > 1 ? (
          <fieldset>
            <legend>Tejida por</legend>
            <label>
              <input type="radio" name="tejedor" value="" defaultChecked={!filtros.tejedor} /> Toda la familia
            </label>
            {tejedores.map((t) => (
              <label key={t.valor}>
                <input type="radio" name="tejedor" value={t.valor} defaultChecked={filtros.tejedor === t.valor} /> {t.texto}
              </label>
            ))}
          </fieldset>
        ) : null}

        {tecnicas.length > 0 ? (
          <fieldset>
            <legend>Técnica</legend>
            <label>
              <input type="radio" name="tecnica" value="" defaultChecked={!filtros.tecnica} /> Todas
            </label>
            {tecnicas.map((t) => (
              <label key={t.valor}>
                <input type="radio" name="tecnica" value={t.valor} defaultChecked={filtros.tecnica === t.valor} /> {t.texto}
              </label>
            ))}
          </fieldset>
        ) : null}

        <noscript>
          <button type="submit" className="boton boton-verde">
            Aplicar filtros
          </button>
        </noscript>

        {hayFiltros ? (
          <button
            type="button"
            className="boton boton-texto"
            onClick={() => {
              form.current?.reset();
              startTransition(() => router.replace(urlCatalogo(ruta, {}, filtros.q ? { q: filtros.q } : {}), { scroll: false }));
            }}
          >
            <Icono nombre="cerrar" width={16} height={16} /> Quitar filtros
          </button>
        ) : null}
      </form>
    </>
  );
}
