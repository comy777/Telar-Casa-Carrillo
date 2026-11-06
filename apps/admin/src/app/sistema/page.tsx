"use client";

import { useQuery } from "@tanstack/react-query";
import { Aviso, Esqueleto } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { Cabecera, Insignia, Tabla, fecha } from "@/components/base";
import { ConPermiso } from "@/components/marco";

export default function Sistema() {
  return (
    <ConPermiso permiso="reports:read">
      <Pantalla />
    </ConPermiso>
  );
}

const SENALES: Record<string, string> = {
  failedWebhooks: "Notificaciones de pago sin procesar",
  invalidSignatures24h: "Firmas inválidas (24 h)",
  stalePendingPayments: "Pagos pendientes sin novedad (> 1 h)",
  overdueUnpaidOrders: "Pedidos vencidos sin cancelar",
  paymentsNeedingReview: "Pagos por revisar",
};

function Pantalla() {
  const estado = useQuery({
    queryKey: ["sistema"],
    queryFn: async () => (await api.GET("/api/v1/admin/system/status")).data,
    refetchInterval: 60_000,
  });
  const s = estado.data;
  if (estado.error) return <Aviso tono="error">{errorMessage(estado.error)}</Aviso>;
  if (!s) return <Esqueleto alto={360} />;
  const horas = Math.floor(s.uptimeSeconds / 3600);

  return (
    <>
      <Cabecera titulo="Estado del sistema" acciones={s.healthy ? <Insignia tono="lleno">Todo en orden</Insignia> : <Insignia tono="rojo">Requiere atención</Insignia>} />
      <div className="rejilla-2">
        <section className="panel">
          <h2>Señales</h2>
          <ul className="lista-simple">
            {Object.entries(s.signals).map(([k, v]) => (
              <li key={k}>
                <span>{SENALES[k] ?? k}</span>
                <Insignia tono={v === 0 ? "verde" : "rojo"}>{v}</Insignia>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <h2>Servicios</h2>
          <ul className="lista-simple">
            <li>
              <span>Pagos con Wompi</span>
              <Insignia tono={s.services.payments ? "verde" : "rojo"}>{s.services.payments ? "Configurado" : "Sin llaves"}</Insignia>
            </li>
            <li>
              <span>Correo (SMTP)</span>
              <Insignia tono={s.services.email ? "verde" : "ambar"}>{s.services.email ? "Configurado" : "Solo en el log"}</Insignia>
            </li>
            <li>
              <span>Imágenes</span>
              <Insignia tono={s.services.imageStorage === "cloudinary" ? "verde" : "ambar"}>{s.services.imageStorage === "cloudinary" ? "Cloudinary" : "Disco local"}</Insignia>
            </li>
            <li>
              <span>Destinatarios de alertas</span>
              <Insignia tono={s.services.alertRecipients > 0 ? "verde" : "ambar"}>{s.services.alertRecipients}</Insignia>
            </li>
            <li>
              <span>API en marcha hace</span>
              <span>{horas > 0 ? `${horas} h` : `${Math.round(s.uptimeSeconds / 60)} min`}</span>
            </li>
          </ul>
        </section>
      </div>
      <section className="panel">
        <h2>Procesos programados</h2>
        <Tabla
          filas={s.jobs}
          clave={(j) => j.name}
          columnas={[
            { titulo: "Proceso", celda: (j) => j.name },
            { titulo: "Estado", celda: (j) => (!j.enabled ? <Insignia>Apagado</Insignia> : j.consecutiveFailures > 0 ? <Insignia tono="rojo">{j.consecutiveFailures} fallos</Insignia> : <Insignia tono="verde">Bien</Insignia>) },
            { titulo: "Última ejecución", celda: (j) => fecha(j.lastRunAt, true) },
            { titulo: "Último error", celda: (j) => (j.lastError ? `${fecha(j.lastErrorAt, true)} · ${j.lastError}` : "—") },
          ]}
        />
      </section>
    </>
  );
}
