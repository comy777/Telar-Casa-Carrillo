"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Aviso, Boton, Campo, CampoTexto, Casilla } from "@telar/ui";
import { api } from "@/lib/api-browser";
import { aplicarErrorApi } from "@/lib/formularios";

const esquema = z.object({
  name: z.string().trim().min(2, "Escribe tu nombre").max(120),
  email: z.string().trim().email("Escribe un correo válido"),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(10, "Cuéntanos un poco más").max(4000),
  acceptPrivacy: z.literal(true, { message: "Debes aceptar el tratamiento de datos" }),
});
type Datos = z.infer<typeof esquema>;

export function FormularioContacto() {
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setError: setCampo, formState } = useForm<Datos>({ resolver: zodResolver(esquema) });
  const e = formState.errors;

  if (enviado) {
    return (
      <div className="contacto-ok" role="status">
        <h2>Recibimos tu mensaje</h2>
        <p>La familia te responde al correo que dejaste, normalmente en uno o dos días hábiles.</p>
      </div>
    );
  }

  return (
    <form
      className="formulario contacto-formulario"
      noValidate
      onSubmit={handleSubmit(async (d) => {
        setError(null);
        try {
          await api.POST("/api/v1/contact", {
            body: { ...d, phone: d.phone || null, subject: d.subject || null, acceptPrivacy: true },
          });
          setEnviado(true);
        } catch (err) {
          setError(aplicarErrorApi(err, setCampo, ["name", "email", "phone", "subject", "message"]));
        }
      })}
    >
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <div className="fila-2">
        <Campo etiqueta="Nombre" autoComplete="name" {...register("name")} error={e.name?.message} />
        <Campo etiqueta="Correo" type="email" autoComplete="email" {...register("email")} error={e.email?.message} />
      </div>
      <div className="fila-2">
        <Campo etiqueta="Celular (opcional)" type="tel" autoComplete="tel" {...register("phone")} />
        <Campo etiqueta="Asunto (opcional)" placeholder="Pedido especial, cambio, envío…" {...register("subject")} />
      </div>
      <CampoTexto etiqueta="Mensaje" rows={7} {...register("message")} error={e.message?.message} />
      <Casilla {...register("acceptPrivacy")} error={e.acceptPrivacy?.message}>
        Acepto el <Link href="/tratamiento-de-datos">tratamiento de mis datos</Link> para que me respondan (Ley 1581 de 2012).
      </Casilla>
      <Boton type="submit" variante="accion" cargando={formState.isSubmitting}>
        Enviar mensaje
      </Boton>
    </form>
  );
}
