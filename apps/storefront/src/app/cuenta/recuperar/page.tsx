"use client";

import Link from "next/link";
import { useState } from "react";
import { Aviso, Boton, Campo } from "@telar/ui";
import { errorMessage, isApiError } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { MarcoAcceso } from "@/features/auth/marco-cuenta";

export default function Recuperar() {
  const [correo, setCorreo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (enviado) {
    return (
      <MarcoAcceso titulo="Revisa tu correo">
        <p>
          Si <strong>{correo}</strong> tiene una cuenta, te llegará un enlace para crear una contraseña nueva. Vence en poco
          tiempo: úsalo pronto.
        </p>
        <Link href="/cuenta/ingresar">Volver a ingresar</Link>
      </MarcoAcceso>
    );
  }

  return (
    <MarcoAcceso titulo="Recupera tu contraseña" pie={<Link href="/cuenta/ingresar">Volver a ingresar</Link>}>
      <p>Escribe tu correo y te enviamos un enlace para crear una contraseña nueva.</p>
      <form
        className="formulario"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return setError("Escribe un correo válido.");
          setCargando(true);
          try {
            await api.POST("/api/v1/auth/forgot-password", { body: { email: correo } });
            setEnviado(true);
          } catch (err) {
            // 429: demasiados intentos; cualquier otro error se muestra igual.
            setError(isApiError(err) && err.status === 429 ? errorMessage(err) : errorMessage(err));
          } finally {
            setCargando(false);
          }
        }}
      >
        {error ? <Aviso tono="error">{error}</Aviso> : null}
        <Campo etiqueta="Correo" type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
        <Boton type="submit" variante="accion" cargando={cargando}>
          Enviar enlace
        </Boton>
      </form>
    </MarcoAcceso>
  );
}
