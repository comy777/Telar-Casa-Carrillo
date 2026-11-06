"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, CampoTexto, Casilla, formatoPesos } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { Cabecera, Insignia, Tabla } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Metodo = Schema<"ShippingMethodResponse">;

export default function MetodosEnvio() {
  return (
    <ConPermiso permiso="shipping:manage">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<Metodo | "nuevo" | null>(null);
  const lista = useQuery({ queryKey: ["metodos-envio-admin"], queryFn: async () => (await api.GET("/api/v1/admin/shipping-methods")).data ?? [] });

  return (
    <>
      <Cabecera
        titulo="Métodos de envío"
        acciones={
          <Boton variante="verde" onClick={() => setEditando("nuevo")}>
            Nuevo método
          </Boton>
        }
      />
      <div className="rejilla-edicion">
        <Tabla
          cargando={lista.isPending}
          error={lista.error}
          filas={lista.data}
          clave={(m) => m.id}
          columnas={[
            {
              titulo: "Método",
              celda: (m) => (
                <button type="button" className="boton boton-texto" onClick={() => setEditando(m)}>
                  {m.name}
                </button>
              ),
            },
            { titulo: "Costo", clase: "num", celda: (m) => formatoPesos(m.basePrice) },
            { titulo: "Gratis desde", clase: "num", celda: (m) => (m.freeShippingThreshold ? formatoPesos(m.freeShippingThreshold) : "—") },
            { titulo: "Entrega", celda: (m) => m.estimatedDelivery ?? "—" },
            { titulo: "Estado", celda: (m) => (m.isActive ? <Insignia tono="verde">Activo</Insignia> : <Insignia>Inactivo</Insignia>) },
          ]}
        />
        {editando ? (
          <Formulario
            key={editando === "nuevo" ? "nuevo" : editando.id}
            metodo={editando === "nuevo" ? null : editando}
            onCerrar={() => setEditando(null)}
            onGuardado={async () => {
              await qc.invalidateQueries({ queryKey: ["metodos-envio-admin"] });
              setEditando(null);
            }}
          />
        ) : null}
      </div>
    </>
  );
}

function Formulario({ metodo, onCerrar, onGuardado }: { metodo: Metodo | null; onCerrar: () => void; onGuardado: () => Promise<void> }) {
  const [d, setD] = useState({
    name: metodo?.name ?? "",
    description: metodo?.description ?? "",
    basePrice: metodo ? String(metodo.basePrice) : "",
    freeShippingThreshold: metodo?.freeShippingThreshold ? String(metodo.freeShippingThreshold) : "",
    estimatedDelivery: metodo?.estimatedDelivery ?? "",
    sortOrder: String(metodo?.sortOrder ?? 0),
    isActive: metodo?.isActive ?? true,
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
        const body = {
          name: d.name,
          description: d.description || null,
          basePrice: Number(d.basePrice),
          freeShippingThreshold: d.freeShippingThreshold ? Number(d.freeShippingThreshold) : null,
          estimatedDelivery: d.estimatedDelivery || null,
          sortOrder: Number(d.sortOrder) || 0,
          isActive: d.isActive,
        };
        try {
          if (metodo) await api.PATCH("/api/v1/admin/shipping-methods/{id}", { params: { path: { id: metodo.id } }, body });
          else await api.POST("/api/v1/admin/shipping-methods", { body });
          await onGuardado();
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setEnviando(false);
        }
      }}
    >
      <h2>{metodo ? metodo.name : "Nuevo método de envío"}</h2>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <Campo etiqueta="Nombre" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} required />
      <CampoTexto etiqueta="Descripción" rows={2} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
      <div className="fila-2">
        <Campo etiqueta="Costo (pesos, IVA incluido)" type="number" min={0} step={100} value={d.basePrice} onChange={(e) => setD({ ...d, basePrice: e.target.value })} required />
        <Campo etiqueta="Gratis desde (pesos)" type="number" min={0} step={1000} value={d.freeShippingThreshold} onChange={(e) => setD({ ...d, freeShippingThreshold: e.target.value })} />
      </div>
      <div className="fila-2">
        <Campo etiqueta="Tiempo de entrega" placeholder="3 a 6 días hábiles" value={d.estimatedDelivery} onChange={(e) => setD({ ...d, estimatedDelivery: e.target.value })} />
        <Campo etiqueta="Orden" type="number" min={0} value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value })} />
      </div>
      <Casilla checked={d.isActive} onChange={(e) => setD({ ...d, isActive: e.target.checked })}>
        Disponible en el checkout
      </Casilla>
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
