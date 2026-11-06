"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Aviso, Boton, Campo } from "@telar/ui";
import { isApiError } from "@telar/api-client";
import { useSesion } from "@/features/auth/session-context";
import { MarcoAcceso } from "@/features/auth/marco-cuenta";
import { aplicarErrorApi } from "@/lib/formularios";

const esquema = z.object({
  email: z.string().trim().email("Escribe un correo válido"),
  password: z.string().min(1, "Escribe tu contraseña"),
});
type Datos = z.infer<typeof esquema>;

/** Solo rutas internas de la tienda, para no redirigir a sitios externos. */
const destinoSeguro = (v: string | null) => (v && v.startsWith("/") && !v.startsWith("//") ? v : "/cuenta");

function Formulario() {
  const { ingresar } = useSesion();
  const router = useRouter();
  const volver = destinoSeguro(useSearchParams().get("volver"));
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setError: setCampo, formState } = useForm<Datos>({ resolver: zodResolver(esquema) });

  return (
    <form
      className="formulario"
      noValidate
      onSubmit={handleSubmit(async (d) => {
        setError(null);
        try {
          await ingresar(d.email, d.password);
          router.replace(volver);
        } catch (e) {
          if (isApiError(e) && e.status === 401) setError("El correo o la contraseña no coinciden.");
          else if (isApiError(e) && e.code === "EMAIL_NOT_VERIFIED")
            setError("Aún no confirmas tu correo. Revisa tu bandeja de entrada o pide un enlace nuevo.");
          else setError(aplicarErrorApi(e, setCampo, ["email", "password"]));
        }
      })}
    >
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <Campo etiqueta="Correo" type="email" autoComplete="email" {...register("email")} error={formState.errors.email?.message} />
      <Campo
        etiqueta="Contraseña"
        type="password"
        autoComplete="current-password"
        {...register("password")}
        error={formState.errors.password?.message}
      />
      <Boton type="submit" variante="accion" cargando={formState.isSubmitting}>
        Ingresar
      </Boton>
      <Link href="/cuenta/recuperar" className="enlace-claro">
        Olvidé mi contraseña
      </Link>
    </form>
  );
}

export default function Ingresar() {
  return (
    <MarcoAcceso
      titulo="Ingresa a tu cuenta"
      pie={
        <p>
          ¿Primera vez? <Link href="/cuenta/registro">Crea tu cuenta</Link>. También puedes comprar sin cuenta.
        </p>
      }
    >
      <Suspense>
        <Formulario />
      </Suspense>
    </MarcoAcceso>
  );
}
