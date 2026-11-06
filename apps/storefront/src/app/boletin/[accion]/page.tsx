"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { claseBoton } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { useTokenDeUrl } from "@/lib/formularios";
import { MarcoAcceso } from "@/features/auth/marco-cuenta";

/** /boletin/confirmar?token=… y /boletin/baja?token=… (enlaces del correo). */
export default function Boletin({ params }: { params: Promise<{ accion: string }> }) {
  const { accion } = use(params);
  const valida = accion === "confirmar" || accion === "baja";
  const token = useTokenDeUrl();
  const peticion = useQuery({
    queryKey: ["boletin", accion, token],
    queryFn: async () => {
      const ruta = accion === "confirmar" ? "/api/v1/content/newsletter/confirm" : "/api/v1/content/newsletter/unsubscribe";
      await api.POST(ruta, { body: { token: token! } });
      return true;
    },
    enabled: valida && Boolean(token),
    retry: false,
    staleTime: Infinity,
  });

  if (!valida) notFound();
  if (token === undefined || (token && peticion.isPending)) {
    return (
      <MarcoAcceso titulo="Un momento…">
        <p aria-live="polite">Procesando tu solicitud.</p>
      </MarcoAcceso>
    );
  }
  if (!peticion.isSuccess) {
    return (
      <MarcoAcceso titulo="No pudimos completar la solicitud">
        <p>{token ? errorMessage(peticion.error, "El enlace no es válido.") : "El enlace está incompleto. Ábrelo completo desde el correo."}</p>
        <Link href="/" className={claseBoton("claro")}>
          Ir a la tienda
        </Link>
      </MarcoAcceso>
    );
  }
  return (
    <MarcoAcceso titulo={accion === "confirmar" ? "¡Listo! Ya estás suscrito" : "Te diste de baja"}>
      <p>
        {accion === "confirmar"
          ? "Te escribiremos cuando salgan piezas nuevas del telar. Puedes darte de baja desde cualquier correo."
          : "No te enviaremos más correos del boletín."}
      </p>
      <Link href="/productos" className={claseBoton("claro")}>
        Ver las piezas
      </Link>
    </MarcoAcceso>
  );
}
