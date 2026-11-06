"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Aviso, Boton, Campo, Esqueleto } from "@telar/ui";
import { isApiError } from "@telar/api-client";
import { api, session } from "@/lib/api-browser";
import { AreaCuenta } from "@/features/account/area-cuenta";
import { useSesion } from "@/features/auth/session-context";
import { aplicarErrorApi, CONTRASENA_MIN } from "@/lib/formularios";

const esquemaPerfil = z.object({
  firstName: z.string().trim().min(1, "Escribe tu nombre").max(80),
  lastName: z.string().trim().min(1, "Escribe tu apellido").max(80),
  phone: z.string().trim().max(30).optional(),
});
type Perfil = z.infer<typeof esquemaPerfil>;

const esquemaClave = z
  .object({
    currentPassword: z.string().min(1, "Escribe tu contraseña actual"),
    newPassword: z.string().min(CONTRASENA_MIN, `Usa al menos ${CONTRASENA_MIN} caracteres`).max(128),
    confirmar: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmar, { path: ["confirmar"], message: "Las contraseñas no coinciden" });
type Clave = z.infer<typeof esquemaClave>;

function DatosPersonales() {
  const qc = useQueryClient();
  const { recargar } = useSesion();
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const perfil = useQuery({ queryKey: ["perfil"], queryFn: async () => (await api.GET("/api/v1/account/profile")).data });
  const { register, handleSubmit, reset, setError: setCampo, formState } = useForm<Perfil>({ resolver: zodResolver(esquemaPerfil) });

  useEffect(() => {
    if (perfil.data) reset({ firstName: perfil.data.firstName, lastName: perfil.data.lastName, phone: perfil.data.phone ?? "" });
  }, [perfil.data, reset]);

  if (perfil.isPending) return <Esqueleto alto={260} />;

  return (
    <section aria-labelledby="t-datos" className="tarjeta-cuenta">
      <h2 id="t-datos">Datos personales</h2>
      <form
        className="formulario"
        noValidate
        onSubmit={handleSubmit(async (d) => {
          setOk(false);
          setError(null);
          try {
            const { data } = await api.PATCH("/api/v1/account/profile", { body: { ...d, phone: d.phone || null } });
            qc.setQueryData(["perfil"], data);
            await recargar();
            setOk(true);
          } catch (e) {
            setError(aplicarErrorApi(e, setCampo, ["firstName", "lastName", "phone"]));
          }
        })}
      >
        {ok ? <Aviso tono="exito">Guardamos tus datos.</Aviso> : null}
        {error ? <Aviso tono="error">{error}</Aviso> : null}
        <div className="fila-2">
          <Campo etiqueta="Nombre" autoComplete="given-name" {...register("firstName")} error={formState.errors.firstName?.message} />
          <Campo etiqueta="Apellido" autoComplete="family-name" {...register("lastName")} error={formState.errors.lastName?.message} />
        </div>
        <Campo etiqueta="Correo" value={perfil.data?.email ?? ""} readOnly ayuda="El correo no se puede cambiar desde aquí." />
        <Campo etiqueta="Celular" type="tel" inputMode="tel" autoComplete="tel" {...register("phone")} error={formState.errors.phone?.message} />
        <Boton type="submit" variante="verde" cargando={formState.isSubmitting} disabled={!formState.isDirty}>
          Guardar cambios
        </Boton>
      </form>
    </section>
  );
}

function CambiarClave() {
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset, setError: setCampo, formState } = useForm<Clave>({ resolver: zodResolver(esquemaClave) });
  return (
    <section aria-labelledby="t-clave" className="tarjeta-cuenta">
      <h2 id="t-clave">Contraseña</h2>
      <form
        className="formulario"
        noValidate
        onSubmit={handleSubmit(async (d) => {
          setOk(false);
          setError(null);
          try {
            const { data } = await api.POST("/api/v1/auth/change-password", {
              body: { currentPassword: d.currentPassword, newPassword: d.newPassword },
            });
            if (data) session.setAccessToken(data.accessToken);
            reset();
            setOk(true);
          } catch (e) {
            if (isApiError(e) && e.code === "INVALID_CURRENT_PASSWORD")
              setCampo("currentPassword", { message: "La contraseña actual no es correcta" });
            else setError(aplicarErrorApi(e, setCampo, ["newPassword"]));
          }
        })}
      >
        {ok ? <Aviso tono="exito">Cambiamos tu contraseña y cerramos las sesiones en otros dispositivos.</Aviso> : null}
        {error ? <Aviso tono="error">{error}</Aviso> : null}
        <Campo etiqueta="Contraseña actual" type="password" autoComplete="current-password" {...register("currentPassword")} error={formState.errors.currentPassword?.message} />
        <div className="fila-2">
          <Campo etiqueta="Contraseña nueva" type="password" autoComplete="new-password" {...register("newPassword")} error={formState.errors.newPassword?.message} />
          <Campo etiqueta="Repítela" type="password" autoComplete="new-password" {...register("confirmar")} error={formState.errors.confirmar?.message} />
        </div>
        <Boton type="submit" variante="borde" cargando={formState.isSubmitting}>
          Cambiar contraseña
        </Boton>
      </form>
    </section>
  );
}

export default function MiCuenta() {
  return (
    <AreaCuenta titulo="Tu cuenta">
      <DatosPersonales />
      <CambiarClave />
    </AreaCuenta>
  );
}
