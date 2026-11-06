"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Aviso, Boton, Campo, claseBoton } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { MarcoAcceso } from "@/features/auth/marco-cuenta";
import { useTokenDeUrl } from "@/lib/formularios";

export default function VerificarCorreo() {
  const token = useTokenDeUrl();
  const verificacion = useQuery({
    queryKey: ["verificar-correo", token],
    queryFn: async () => {
      await api.POST("/api/v1/auth/verify-email", { body: { token: token! } });
      return true;
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: Infinity,
  });

  if (token === undefined || (token && verificacion.isPending)) {
    return (
      <MarcoAcceso titulo="Confirmando tu correo…">
        <p aria-live="polite">Un momento.</p>
      </MarcoAcceso>
    );
  }
  if (verificacion.isSuccess) {
    return (
      <MarcoAcceso titulo="Correo confirmado">
        <p>Tu cuenta quedó activa. Ya puedes ingresar.</p>
        <Link href="/cuenta/ingresar" className={claseBoton("accion")}>
          Ingresar
        </Link>
      </MarcoAcceso>
    );
  }
  return (
    <MarcoAcceso titulo="No pudimos confirmar tu correo">
      {verificacion.error ? <Aviso tono="error">{errorMessage(verificacion.error, "El enlace no es válido o ya venció.")}</Aviso> : null}
      <p>Pide un enlace nuevo con el correo con el que te registraste.</p>
      <Reenviar />
    </MarcoAcceso>
  );
}

function Reenviar() {
  const [correo, setCorreo] = useState("");
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);
  if (listo) return <Aviso tono="exito">Si el correo está registrado, te llegará un enlace nuevo.</Aviso>;
  return (
    <form
      className="formulario"
      onSubmit={async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
          await api.POST("/api/v1/auth/resend-verification", { body: { email: correo } });
        } catch {
          // misma respuesta exista o no la cuenta
        } finally {
          setCargando(false);
          setListo(true);
        }
      }}
    >
      <Campo etiqueta="Correo" type="email" autoComplete="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
      <Boton type="submit" variante="claro" cargando={cargando}>
        Enviar enlace nuevo
      </Boton>
    </form>
  );
}
