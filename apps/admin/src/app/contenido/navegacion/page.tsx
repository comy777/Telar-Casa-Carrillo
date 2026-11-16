"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, CampoSelect, Casilla } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { Cabecera, Insignia, Tabla } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Ruta = Schema<"AdminStoreRouteResponse">;
type Columna = NonNullable<Ruta["footerGroup"]>;

const COLUMNAS: Record<Columna, string> = { SHOP: "Tienda", HELP: "Ayuda", INFO: "Información" };

/** Rutas que en el menú o el pie se muestran como una lista y no como un solo enlace. */
const LISTAS: Record<string, string> = {
  categorias: "Se muestra como la lista de categorías (en el menú, las cuatro primeras).",
  paginas: "Se muestra como la lista de páginas publicadas en Contenido → Páginas.",
};

export default function Navegacion() {
  return (
    <ConPermiso permiso="content:manage">
      <Pantalla />
    </ConPermiso>
  );
}

/** Ruta padre desactivada que también apaga a esta (p. ej. "Mi cuenta" apaga "Seguir mi pedido"). */
function padreApagado(r: Ruta, todas: Ruta[]): Ruta | undefined {
  return todas.find((p) => p.key !== r.key && !p.isEnabled && p.path !== "/" && r.path.startsWith(`${p.path}/`));
}

function Pantalla() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<string | null>(null);
  const lista = useQuery({ queryKey: ["navegacion"], queryFn: async () => (await api.GET("/api/v1/admin/content/navigation")).data ?? [] });
  const rutas = lista.data ?? [];
  const actual = rutas.find((r) => r.key === editando) ?? null;
  const recargar = async () => {
    await qc.invalidateQueries({ queryKey: ["navegacion"] });
  };
  return (
    <>
      <Cabecera titulo="Navegación de la tienda" />
      <Aviso tono="info">
        Activa o desactiva secciones de la tienda y elige qué enlaces van en el menú y en el pie. Una sección desactivada responde
        «página no encontrada» y desaparece de los menús. La tienda aplica los cambios en uno o dos minutos.
      </Aviso>
      <div className="rejilla-edicion">
        <Tabla
          cargando={lista.isPending}
          error={lista.error}
          filas={lista.data}
          clave={(r) => r.key}
          columnas={[
            {
              titulo: "Sección",
              celda: (r) => (
                <button type="button" className="boton boton-texto" onClick={() => setEditando(r.key)} style={{ textAlign: "left" }}>
                  {r.label}
                </button>
              ),
            },
            { titulo: "Dirección", celda: (r) => <code>{r.path === "/:pagina" ? "/{página}" : r.path}</code> },
            { titulo: "Menú", celda: (r) => (r.showInHeader ? "Sí" : "—") },
            { titulo: "Pie", celda: (r) => (r.footerGroup ? COLUMNAS[r.footerGroup] : "—") },
            { titulo: "Orden", clase: "num", celda: (r) => r.sortOrder },
            {
              titulo: "Estado",
              celda: (r) => {
                const padre = padreApagado(r, rutas);
                if (!r.isEnabled) return <Insignia tono="rojo">Desactivada</Insignia>;
                if (padre) return <Insignia tono="ambar">Apagada por «{padre.label}»</Insignia>;
                return <Insignia tono="verde">{r.isLocked ? "Siempre activa" : "Activa"}</Insignia>;
              },
            },
          ]}
        />
        {actual ? <Formulario key={actual.key} r={actual} padre={padreApagado(actual, rutas)} onCerrar={() => setEditando(null)} onListo={recargar} /> : null}
      </div>
    </>
  );
}

function Formulario({ r, padre, onCerrar, onListo }: { r: Ruta; padre: Ruta | undefined; onCerrar: () => void; onListo: () => Promise<void> }) {
  const [d, setD] = useState({
    label: r.label,
    isEnabled: r.isEnabled,
    showInHeader: r.showInHeader,
    footerGroup: (r.footerGroup ?? "") as Columna | "",
    sortOrder: String(r.sortOrder),
  });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [enviando, setEnviando] = useState(false);
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        setOk(false);
        try {
          await api.PATCH("/api/v1/admin/content/navigation/{key}", {
            params: { path: { key: r.key } },
            body: {
              label: d.label,
              isEnabled: d.isEnabled,
              showInHeader: d.showInHeader,
              footerGroup: d.footerGroup || null,
              sortOrder: Number(d.sortOrder) || 0,
            },
          });
          await onListo();
          setOk(true);
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setEnviando(false);
        }
      }}
    >
      <h2>{r.label}</h2>
      <p className="campo-ayuda">
        <code>{r.path === "/:pagina" ? "/{página}" : r.path}</code>
        {r.description ? ` · ${r.description}` : null}
      </p>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      {ok ? <Aviso tono="exito">Guardado. La tienda lo aplica en uno o dos minutos.</Aviso> : null}
      {padre && d.isEnabled ? <Aviso tono="info">Mientras «{padre.label}» esté desactivada, esta sección tampoco se muestra.</Aviso> : null}
      <Casilla checked={d.isEnabled} disabled={r.isLocked} onChange={(e) => setD({ ...d, isEnabled: e.target.checked })}>
        {r.isLocked ? "Activa (esta sección no se puede desactivar)" : "Activa en la tienda"}
      </Casilla>
      <Campo etiqueta="Texto del enlace" value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} required maxLength={40} ayuda={LISTAS[r.key]} />
      <Casilla checked={d.showInHeader} onChange={(e) => setD({ ...d, showInHeader: e.target.checked })}>
        Mostrar en el menú principal
      </Casilla>
      <div className="fila-2">
        <CampoSelect etiqueta="Columna del pie" value={d.footerGroup} onChange={(e) => setD({ ...d, footerGroup: e.target.value as Columna | "" })}>
          <option value="">No aparece en el pie</option>
          {(Object.keys(COLUMNAS) as Columna[]).map((c) => (
            <option key={c} value={c}>
              {COLUMNAS[c]}
            </option>
          ))}
        </CampoSelect>
        <Campo etiqueta="Orden" type="number" min={0} max={10000} value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value })} ayuda="Menor va primero." />
      </div>
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
