"use client";

import { useState } from "react";
import { Aviso, Boton, Campo } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { descargar } from "@/lib/archivos";
import { Cabecera } from "@/components/base";
import { ConPermiso } from "@/components/marco";

const REPORTES = [
  { tipo: "orders", titulo: "Pedidos", texto: "Un renglón por pedido: cliente, totales, IVA, envío, pago y factura.", conRango: true },
  { tipo: "order-items", titulo: "Líneas de pedido", texto: "Un renglón por pieza vendida, con su IVA. Para la contabilidad.", conRango: true },
  { tipo: "inventory", titulo: "Inventario", texto: "Existencias actuales por variante.", conRango: false },
] as const;

const hoy = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

export default function Reportes() {
  return (
    <ConPermiso permiso="reports:read">
      <Pantalla />
    </ConPermiso>
  );
}

function Pantalla() {
  const [desde, setDesde] = useState(`${hoy().slice(0, 8)}01`);
  const [hasta, setHasta] = useState(hoy());
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Cabecera titulo="Reportes">
        <p className="campo-ayuda">Archivos CSV separados por punto y coma, listos para abrir en Excel en español.</p>
      </Cabecera>
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <section className="panel">
        <h2>Periodo</h2>
        <div className="fila-2" style={{ maxWidth: 480 }}>
          <Campo etiqueta="Desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <Campo etiqueta="Hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </section>
      <div className="rejilla-2">
        {REPORTES.map((r) => (
          <section key={r.tipo} className="panel">
            <h2>{r.titulo}</h2>
            <p>{r.texto}</p>
            <Boton
              variante="verde"
              cargando={cargando === r.tipo}
              onClick={async () => {
                setCargando(r.tipo);
                setError(null);
                const qs = new URLSearchParams({ delimiter: ";", ...(r.conRango ? { from: desde, to: hasta } : {}) });
                try {
                  await descargar(`/api/v1/admin/reports/${r.tipo}.csv?${qs}`, `${r.tipo}${r.conRango ? `-${desde}-a-${hasta}` : `-${hoy()}`}.csv`);
                } catch (e) {
                  setError(errorMessage(e));
                } finally {
                  setCargando(null);
                }
              }}
            >
              Descargar CSV
            </Boton>
          </section>
        ))}
      </div>
    </>
  );
}
