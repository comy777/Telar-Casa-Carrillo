"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Campo, CampoSelect, Casilla, formatoPesos } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { Cabecera, Insignia, Tabla, fecha } from "@/components/base";
import { ConPermiso } from "@/components/marco";

type Cupon = Schema<"CouponResponse">;

export default function Cupones() {
  return (
    <ConPermiso permiso="promotions:manage">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<Cupon | "nuevo" | null>(null);
  const lista = useQuery({ queryKey: ["cupones"], queryFn: async () => (await api.GET("/api/v1/admin/coupons")).data });
  const filas = Array.isArray(lista.data) ? lista.data : (lista.data as { items?: Cupon[] } | undefined)?.items;

  return (
    <>
      <Cabecera
        titulo="Cupones"
        acciones={
          <Boton variante="verde" onClick={() => setEditando("nuevo")}>
            Nuevo cupón
          </Boton>
        }
      />
      <div className="rejilla-edicion">
        <Tabla
          cargando={lista.isPending}
          error={lista.error}
          filas={filas}
          clave={(c) => c.id}
          columnas={[
            {
              titulo: "Código",
              celda: (c) => (
                <button type="button" className="boton boton-texto" onClick={() => setEditando(c)}>
                  {c.code}
                </button>
              ),
            },
            { titulo: "Descuento", celda: (c) => (c.discountType === "PERCENTAGE" ? `${c.value} %` : formatoPesos(c.value)) },
            { titulo: "Usos", clase: "num", celda: (c) => `${c.usageCount}${c.usageLimit ? ` / ${c.usageLimit}` : ""}` },
            { titulo: "Vence", celda: (c) => fecha(c.expiresAt) },
            { titulo: "Estado", celda: (c) => (c.isActive ? <Insignia tono="verde">Activo</Insignia> : <Insignia>Inactivo</Insignia>) },
          ]}
        />
        {editando ? (
          <FormularioCupon
            key={editando === "nuevo" ? "nuevo" : editando.id}
            cupon={editando === "nuevo" ? null : editando}
            onCerrar={() => setEditando(null)}
            onGuardado={async () => {
              await qc.invalidateQueries({ queryKey: ["cupones"] });
              setEditando(null);
            }}
          />
        ) : null}
      </div>
    </>
  );
}

const aFecha = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

function FormularioCupon({ cupon, onCerrar, onGuardado }: { cupon: Cupon | null; onCerrar: () => void; onGuardado: () => Promise<void> }) {
  const [d, setD] = useState({
    code: cupon?.code ?? "",
    description: cupon?.description ?? "",
    discountType: cupon?.discountType ?? ("PERCENTAGE" as Cupon["discountType"]),
    value: cupon ? String(cupon.value) : "",
    minimumSubtotal: cupon?.minimumSubtotal ? String(cupon.minimumSubtotal) : "",
    maxDiscount: cupon?.maxDiscount ? String(cupon.maxDiscount) : "",
    usageLimit: cupon?.usageLimit ? String(cupon.usageLimit) : "",
    perCustomerLimit: cupon?.perCustomerLimit ? String(cupon.perCustomerLimit) : "",
    startsAt: aFecha(cupon?.startsAt ?? null),
    expiresAt: aFecha(cupon?.expiresAt ?? null),
    isActive: cupon?.isActive ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const n = (v: string) => (v ? Number(v) : null);
  // Fechas de Colombia: desde el inicio del día hasta el final del día.
  const inicio = (v: string) => (v ? `${v}T00:00:00-05:00` : null);
  const fin = (v: string) => (v ? `${v}T23:59:59-05:00` : null);

  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        setEnviando(true);
        setError(null);
        const body = {
          code: d.code.trim().toUpperCase(),
          description: d.description || null,
          discountType: d.discountType,
          value: Number(d.value),
          minimumSubtotal: n(d.minimumSubtotal),
          maxDiscount: d.discountType === "PERCENTAGE" ? n(d.maxDiscount) : null,
          usageLimit: n(d.usageLimit),
          perCustomerLimit: n(d.perCustomerLimit),
          startsAt: inicio(d.startsAt),
          expiresAt: fin(d.expiresAt),
          isActive: d.isActive,
        };
        try {
          if (cupon) await api.PATCH("/api/v1/admin/coupons/{id}", { params: { path: { id: cupon.id } }, body });
          else await api.POST("/api/v1/admin/coupons", { body });
          await onGuardado();
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setEnviando(false);
        }
      }}
    >
      <h2>{cupon ? `Cupón ${cupon.code}` : "Nuevo cupón"}</h2>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <div className="fila-2">
        <Campo etiqueta="Código" value={d.code} onChange={(e) => setD({ ...d, code: e.target.value.toUpperCase() })} required />
        <CampoSelect etiqueta="Tipo" value={d.discountType} onChange={(e) => setD({ ...d, discountType: e.target.value as Cupon["discountType"] })}>
          <option value="PERCENTAGE">Porcentaje</option>
          <option value="FIXED_AMOUNT">Monto fijo (pesos)</option>
        </CampoSelect>
      </div>
      <Campo etiqueta="Descripción interna" value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} />
      <div className="fila-2">
        <Campo etiqueta={d.discountType === "PERCENTAGE" ? "Porcentaje" : "Pesos"} type="number" min={1} value={d.value} onChange={(e) => setD({ ...d, value: e.target.value })} required />
        {d.discountType === "PERCENTAGE" ? (
          <Campo etiqueta="Tope del descuento (pesos)" type="number" min={0} value={d.maxDiscount} onChange={(e) => setD({ ...d, maxDiscount: e.target.value })} />
        ) : (
          <span />
        )}
      </div>
      <Campo etiqueta="Compra mínima (pesos)" type="number" min={0} value={d.minimumSubtotal} onChange={(e) => setD({ ...d, minimumSubtotal: e.target.value })} />
      <div className="fila-2">
        <Campo etiqueta="Usos en total" type="number" min={1} value={d.usageLimit} onChange={(e) => setD({ ...d, usageLimit: e.target.value })} ayuda="Vacío: sin límite." />
        <Campo etiqueta="Usos por cliente" type="number" min={1} value={d.perCustomerLimit} onChange={(e) => setD({ ...d, perCustomerLimit: e.target.value })} />
      </div>
      <div className="fila-2">
        <Campo etiqueta="Desde" type="date" value={d.startsAt} onChange={(e) => setD({ ...d, startsAt: e.target.value })} />
        <Campo etiqueta="Hasta" type="date" value={d.expiresAt} onChange={(e) => setD({ ...d, expiresAt: e.target.value })} />
      </div>
      <Casilla checked={d.isActive} onChange={(e) => setD({ ...d, isActive: e.target.checked })}>
        Activo
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
