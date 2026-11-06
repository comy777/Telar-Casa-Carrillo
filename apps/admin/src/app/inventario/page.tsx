"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, Esqueleto } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { useSesion } from "@/lib/sesion";
import { Buscador, Cabecera, FiltroSelect, Insignia, Paginador, Tabla, fecha, useFiltros } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Item = Schema<"InventoryItemResponse">;

const TIPOS_MOV: Record<string, string> = {
  IN: "Entrada",
  OUT: "Salida",
  RESERVE: "Apartado",
  RELEASE: "Liberado",
  ADJUSTMENT: "Ajuste",
};

export default function Inventario() {
  return (
    <ConPermiso permiso="inventory:read">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const { valores: f, pagina, poner } = useFiltros(["q", "stock"] as const);
  const [elegido, setElegido] = useState<Item | null>(null);
  const lista = useQuery({
    queryKey: ["inventario", f, pagina],
    queryFn: async () =>
      (
        await api.GET("/api/v1/admin/inventory", {
          params: {
            query: { page: pagina, pageSize: 30, search: f.q || undefined, stock: (f.stock || undefined) as "available" | "low" | "out" | undefined },
          },
        })
      ).data,
  });

  return (
    <>
      <Cabecera titulo="Inventario">
        <div className="barra-filtros">
          <Buscador valor={f.q} onBuscar={(q) => poner({ q })} etiqueta="Buscar producto o SKU" />
          <FiltroSelect
            etiqueta="Existencias"
            valor={f.stock}
            opciones={[
              ["available", "Disponibles"],
              ["low", "Pocas unidades"],
              ["out", "Agotadas"],
            ]}
            onCambio={(stock) => poner({ stock })}
          />
        </div>
      </Cabecera>
      <div className="rejilla-edicion">
        <div className="grupo-campos">
          <Tabla
            cargando={lista.isPending}
            error={lista.error}
            filas={lista.data?.items}
            clave={(i) => i.variantId}
            columnas={[
              {
                titulo: "Pieza",
                celda: (i) => (
                  <button type="button" className="boton boton-texto" onClick={() => setElegido(i)} style={{ textAlign: "left", display: "block" }}>
                    {i.productName}
                    <span className="celda-secundaria">
                      {i.variantName} · {i.sku}
                    </span>
                  </button>
                ),
              },
              { titulo: "En bodega", clase: "num", celda: (i) => i.quantityOnHand },
              { titulo: "Apartadas", clase: "num", celda: (i) => i.quantityReserved },
              { titulo: "Disponibles", clase: "num", celda: (i) => <strong>{i.available}</strong> },
              {
                titulo: "Estado",
                celda: (i) => (
                  <Insignia tono={i.availability === "OUT_OF_STOCK" ? "rojo" : i.availability === "LOW_STOCK" ? "ambar" : "verde"}>
                    {i.availability === "OUT_OF_STOCK" ? "Agotada" : i.availability === "LOW_STOCK" ? `Pocas (≤ ${i.lowStockThreshold})` : "Disponible"}
                  </Insignia>
                ),
              },
            ]}
          />
          <Paginador pagina={pagina} total={lista.data?.total ?? 0} porPagina={30} onCambio={(p) => poner({ pagina: String(p) })} />
        </div>
        {elegido ? <Movimientos key={elegido.variantId} item={elegido} onCerrar={() => setElegido(null)} /> : null}
      </div>
    </>
  );
}

function Movimientos({ item, onCerrar }: { item: Item; onCerrar: () => void }) {
  const qc = useQueryClient();
  const { puede } = useSesion();
  const editable = puede("inventory:manage");
  const actual = useQuery({
    queryKey: ["inventario-item", item.variantId],
    queryFn: async () => (await api.GET("/api/v1/admin/inventory/{variantId}", { params: { path: { variantId: item.variantId } } })).data,
    initialData: item,
  });
  const movs = useQuery({
    queryKey: ["movimientos", item.variantId],
    queryFn: async () =>
      (await api.GET("/api/v1/admin/inventory/{variantId}/movements", { params: { path: { variantId: item.variantId }, query: { pageSize: 30 } } }))
        .data,
  });
  const [entrada, setEntrada] = useState("");
  const [conteo, setConteo] = useState("");
  const [motivo, setMotivo] = useState("");
  const [umbral, setUmbral] = useState(String(item.lowStockThreshold));
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const i = actual.data ?? item;

  const hacer = async (f: () => Promise<unknown>, mensaje: string) => {
    setError(null);
    setOk(null);
    try {
      await f();
      setOk(mensaje);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["inventario"] }),
        qc.invalidateQueries({ queryKey: ["inventario-item", item.variantId] }),
        qc.invalidateQueries({ queryKey: ["movimientos", item.variantId] }),
      ]);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <section className="panel" aria-labelledby="t-mov">
      <div className="panel-cabeza">
        <h2 id="t-mov">{i.productName}</h2>
        <Boton variante="texto" onClick={onCerrar}>
          Cerrar
        </Boton>
      </div>
      <p className="celda-secundaria">
        {i.variantName} · {i.sku}
      </p>
      <dl className="definiciones">
        <dt>En bodega</dt>
        <dd>{i.quantityOnHand}</dd>
        <dt>Apartadas</dt>
        <dd>{i.quantityReserved} (carritos en checkout y pedidos sin pagar)</dd>
        <dt>Disponibles</dt>
        <dd>
          <strong>{i.available}</strong>
        </dd>
      </dl>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      {ok ? <Aviso tono="exito">{ok}</Aviso> : null}
      {editable ? (
        <>
          <form
            className="fila-2"
            onSubmit={(e) => {
              e.preventDefault();
              void hacer(
                () => api.POST("/api/v1/admin/inventory/{variantId}/receipts", { params: { path: { variantId: i.variantId } }, body: { quantity: Number(entrada), reason: motivo || undefined } }),
                `Entraron ${entrada} unidades.`,
              ).then(() => setEntrada(""));
            }}
          >
            <Campo etiqueta="Entrada de unidades" type="number" min={1} value={entrada} onChange={(e) => setEntrada(e.target.value)} required ayuda="Piezas nuevas que salieron del telar." />
            <Boton type="submit" variante="verde" className="casilla-alineada">
              Registrar entrada
            </Boton>
          </form>
          <form
            className="grupo-campos"
            onSubmit={(e) => {
              e.preventDefault();
              void hacer(
                () => api.PUT("/api/v1/admin/inventory/{variantId}/count", { params: { path: { variantId: i.variantId } }, body: { quantityOnHand: Number(conteo), reason: motivo } }),
                "Conteo registrado.",
              ).then(() => setConteo(""));
            }}
          >
            <div className="fila-2">
              <Campo etiqueta="Conteo físico (total en bodega)" type="number" min={0} value={conteo} onChange={(e) => setConteo(e.target.value)} required />
              <Campo etiqueta="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} required placeholder="Conteo mensual, pieza dañada…" />
            </div>
            <Boton type="submit" variante="borde">
              Ajustar al conteo
            </Boton>
          </form>
          <form
            className="fila-2"
            onSubmit={(e) => {
              e.preventDefault();
              void hacer(
                () => api.PATCH("/api/v1/admin/inventory/{variantId}", { params: { path: { variantId: i.variantId } }, body: { lowStockThreshold: Number(umbral) } }),
                "Umbral actualizado.",
              );
            }}
          >
            <Campo etiqueta="Avisar cuando queden" type="number" min={0} value={umbral} onChange={(e) => setUmbral(e.target.value)} />
            <Boton type="submit" variante="texto" className="casilla-alineada">
              Guardar umbral
            </Boton>
          </form>
        </>
      ) : null}
      <h3>Movimientos</h3>
      {movs.isPending ? (
        <Esqueleto alto={120} />
      ) : (movs.data?.items.length ?? 0) === 0 ? (
        <p>Sin movimientos.</p>
      ) : (
        <ol className="linea-tiempo">
          {movs.data!.items.map((m) => (
            <li key={m.id}>
              <strong>
                {TIPOS_MOV[m.type] ?? m.type} {m.quantity > 0 && m.type !== "OUT" ? `+${m.quantity}` : m.quantity}
              </strong>{" "}
              → {m.onHandAfter} en bodega
              <span>
                {fecha(m.createdAt, true)}
                {m.reason ? ` · ${m.reason}` : ""}
                {m.referenceType ? ` · ${m.referenceType}` : ""}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
