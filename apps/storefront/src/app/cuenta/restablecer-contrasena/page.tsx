"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Aviso, Boton, Campo, claseBoton } from "@telar/ui";
import { api } from "@/lib/api-browser";
import { MarcoAcceso } from "@/features/auth/marco-cuenta";
import { aplicarErrorApi, CONTRASENA_MIN, useTokenDeUrl } from "@/lib/formularios";

const esquema = z
  .object({
    password: z.string().min(CONTRASENA_MIN, `Usa al menos ${CONTRASENA_MIN} caracteres`).max(128),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, { path: ["confirmar"], message: "Las contraseñas no coinciden" });
type Datos = z.infer<typeof esquema>;

export default function Restablecer() {
  const token = useTokenDeUrl();
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setError: setCampo, formState } = useForm<Datos>({ resolver: zodResolver(esquema) });

  if (token === undefined) return null;
  if (listo) {
    return (
      <MarcoAcceso titulo="Contraseña cambiada">
        <p>Por seguridad cerramos las sesiones abiertas. Ingresa con tu contraseña nueva.</p>
        <Link href="/cuenta/ingresar" className={claseBoton("accion")}>
          Ingresar
        </Link>
      </MarcoAcceso>
    );
  }
  if (!token) {
    return (
      <MarcoAcceso titulo="El enlace no es válido">
        <p>Abre el enlace completo que te llegó al correo, o pide uno nuevo.</p>
        <Link href="/cuenta/recuperar" className={claseBoton("claro")}>
          Pedir enlace nuevo
        </Link>
      </MarcoAcceso>
    );
  }

  return (
    <MarcoAcceso titulo="Crea una contraseña nueva">
      <form
        className="formulario"
        noValidate
        onSubmit={handleSubmit(async (d) => {
          setError(null);
          try {
            await api.POST("/api/v1/auth/reset-password", { body: { token, password: d.password } });
            setListo(true);
          } catch (e) {
            setError(aplicarErrorApi(e, setCampo, ["password"], "El enlace no es válido o ya venció. Pide uno nuevo."));
          }
        })}
      >
        {error ? (
          <Aviso tono="error">
            {error} <Link href="/cuenta/recuperar">Pedir enlace nuevo</Link>
          </Aviso>
        ) : null}
        <Campo
          etiqueta="Contraseña nueva"
          type="password"
          autoComplete="new-password"
          ayuda={`Mínimo ${CONTRASENA_MIN} caracteres.`}
          {...register("password")}
          error={formState.errors.password?.message}
        />
        <Campo
          etiqueta="Repítela"
          type="password"
          autoComplete="new-password"
          {...register("confirmar")}
          error={formState.errors.confirmar?.message}
        />
        <Boton type="submit" variante="accion" cargando={formState.isSubmitting}>
          Guardar contraseña
        </Boton>
      </form>
    </MarcoAcceso>
  );
}
