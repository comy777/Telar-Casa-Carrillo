"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Aviso, Boton, Campo, Casilla } from "@telar/ui";
import { api } from "@/lib/api-browser";
import { MarcoAcceso } from "@/features/auth/marco-cuenta";
import { aplicarErrorApi, CONTRASENA_MIN } from "@/lib/formularios";

const esquema = z.object({
  firstName: z.string().trim().min(1, "Escribe tu nombre").max(80),
  lastName: z.string().trim().min(1, "Escribe tu apellido").max(80),
  email: z.string().trim().email("Escribe un correo válido"),
  phone: z.string().trim().max(30).optional(),
  password: z.string().min(CONTRASENA_MIN, `Usa al menos ${CONTRASENA_MIN} caracteres`).max(128),
  acceptTerms: z.literal(true, { message: "Debes aceptar los términos y el tratamiento de datos" }),
});
type Datos = z.infer<typeof esquema>;

export default function Registro() {
  const [enviado, setEnviado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setError: setCampo, formState } = useForm<Datos>({ resolver: zodResolver(esquema) });
  const e = formState.errors;

  if (enviado) {
    return (
      <MarcoAcceso titulo="Revisa tu correo">
        <p>
          Te enviamos un enlace a <strong>{enviado}</strong> para confirmar tu cuenta. Ábrelo desde este dispositivo o
          desde cualquier otro.
        </p>
        <p className="nota-iva">Si no llega en unos minutos, revisa la carpeta de spam.</p>
      </MarcoAcceso>
    );
  }

  return (
    <MarcoAcceso
      titulo="Crea tu cuenta"
      pie={
        <p>
          ¿Ya tienes cuenta? <Link href="/cuenta/ingresar">Ingresa</Link>
        </p>
      }
    >
      <form
        className="formulario"
        noValidate
        onSubmit={handleSubmit(async (d) => {
          setError(null);
          try {
            await api.POST("/api/v1/auth/register", {
              body: { ...d, phone: d.phone || undefined, acceptTerms: true },
            });
            setEnviado(d.email);
          } catch (err) {
            setError(aplicarErrorApi(err, setCampo, ["firstName", "lastName", "email", "phone", "password"]));
          }
        })}
      >
        {error ? <Aviso tono="error">{error}</Aviso> : null}
        <div className="fila-2">
          <Campo etiqueta="Nombre" autoComplete="given-name" {...register("firstName")} error={e.firstName?.message} />
          <Campo etiqueta="Apellido" autoComplete="family-name" {...register("lastName")} error={e.lastName?.message} />
        </div>
        <Campo etiqueta="Correo" type="email" autoComplete="email" {...register("email")} error={e.email?.message} />
        <Campo
          etiqueta="Celular (opcional)"
          type="tel"
          autoComplete="tel"
          inputMode="tel"
          {...register("phone")}
          error={e.phone?.message}
        />
        <Campo
          etiqueta="Contraseña"
          type="password"
          autoComplete="new-password"
          ayuda={`Mínimo ${CONTRASENA_MIN} caracteres. Una frase fácil de recordar funciona bien.`}
          {...register("password")}
          error={e.password?.message}
        />
        <Casilla {...register("acceptTerms")} error={e.acceptTerms?.message}>
          Acepto los <Link href="/terminos-y-condiciones">términos y condiciones</Link> y el{" "}
          <Link href="/tratamiento-de-datos">tratamiento de mis datos personales</Link> (Ley 1581 de 2012).
        </Casilla>
        <Boton type="submit" variante="accion" cargando={formState.isSubmitting}>
          Crear cuenta
        </Boton>
      </form>
    </MarcoAcceso>
  );
}
