"use client";

import Link from "next/link";
import { useState } from "react";
import { Controller, useForm, useWatch, type FieldErrors, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Aviso, Boton, Campo, CampoSelect, CampoTexto, Casilla, cx } from "@telar/ui";
import { api } from "@/lib/api-browser";
import { aplicarErrorApi } from "@/lib/formularios";
import type { TipoCotizacion } from "@/lib/lugar";

const TIPOS: Array<{ valor: TipoCotizacion; titulo: string; texto: string }> = [
  { valor: "EVENT", titulo: "Evento o celebración", texto: "Cumpleaños, reuniones familiares o de empresa." },
  { valor: "GROUP_VISIT", titulo: "Visita de grupo", texto: "Un paseo de colegio, iglesia o amigos para comer y jugar." },
  { valor: "COURT_RENTAL", titulo: "Alquiler de cancha", texto: "Banquitas, voleibol o la mesa de ping pong, por horas." },
];

/** Hoy en Colombia, como AAAA-MM-DD: la fecha mínima que acepta el formulario y el backend. */
const hoyEnColombia = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

const entero = (min: number, max: number, mensaje: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || (/^\d+$/.test(v) && Number(v) >= min && Number(v) <= max), mensaje);

const esquema = z.object({
  kind: z.enum(["EVENT", "GROUP_VISIT", "COURT_RENTAL"], { message: "Elige qué quieres cotizar" }),
  eventDate: z.string().optional(),
  startTime: z.string().optional(),
  durationHours: z.string().optional(),
  people: entero(1, 2000, "Escribe un número de personas entre 1 y 2000"),
  activityIds: z.array(z.string()).max(10),
  includesFood: z.boolean(),
  name: z.string().trim().min(2, "Escribe tu nombre").max(120),
  email: z.string().trim().email("Escribe un correo válido"),
  phone: z.string().trim().min(7, "Escribe un celular para llamarte").max(30),
  message: z.string().trim().max(2000).optional(),
  acceptPrivacy: z.literal(true, { message: "Debes aceptar el tratamiento de datos" }),
});
type Datos = z.infer<typeof esquema>;
type CampoPorTipo = "eventDate" | "startTime" | "durationHours" | "people";

/** Lo que cada tipo exige. Va aparte del esquema para que salga junto con los demás errores. */
function erroresPorTipo(d: Partial<Datos>): Partial<Record<CampoPorTipo, string>> {
  const errores: Partial<Record<CampoPorTipo, string>> = {};
  if (d.eventDate && d.eventDate < hoyEnColombia()) errores.eventDate = "Elige una fecha desde hoy";
  if (d.kind === "EVENT") {
    if (!d.eventDate) errores.eventDate = "¿Qué día es el evento?";
    if (!d.people) errores.people = "¿Cuántas personas vienen?";
  }
  if (d.kind === "GROUP_VISIT" && !d.people) errores.people = "¿Cuántas personas vienen?";
  if (d.kind === "COURT_RENTAL") {
    if (!d.eventDate) errores.eventDate = "¿Qué día quieres la cancha?";
    if (!d.startTime) errores.startTime = "¿A qué hora empiezas?";
    if (!d.durationHours) errores.durationHours = "¿Por cuántas horas?";
  }
  return errores;
}

const resolverBase = zodResolver(esquema);
const resolver: Resolver<Datos> = async (valores, contexto, opciones) => {
  const resultado = await resolverBase(valores, contexto, opciones);
  const extra = Object.entries(erroresPorTipo(valores));
  if (extra.length === 0) return resultado;
  const errores: FieldErrors<Datos> = { ...resultado.errors };
  for (const [campo, message] of extra) {
    const clave = campo as CampoPorTipo;
    if (!errores[clave]) errores[clave] = { type: "custom", message };
  }
  return { values: {}, errors: errores };
};

const CAMPOS = ["kind", "eventDate", "startTime", "durationHours", "people", "name", "email", "phone", "message"] as const;

export function FormularioCotizacion({ actividades }: { actividades: Array<{ id: string; name: string }> }) {
  const [enviada, setEnviada] = useState<{ tipo: string; nombre: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, control, handleSubmit, setError: setCampo, reset, formState } = useForm<Datos>({
    resolver,
    defaultValues: { activityIds: [], includesFood: false },
  });
  const tipo = useWatch({ control, name: "kind" });
  const e = formState.errors;
  const hoy = hoyEnColombia();

  if (enviada) {
    return (
      <div className="boleta-ok" role="status" tabIndex={-1} ref={(el) => el?.focus()}>
        <h3>Recibimos tu solicitud</h3>
        <p>
          {enviada.nombre}, ya le llegó a la familia tu pedido de cotización ({enviada.tipo.toLowerCase()}). Te enviamos una copia al correo y te contactamos
          al celular que dejaste.
        </p>
        <Boton
          variante="claro"
          onClick={() => {
            reset({ activityIds: [], includesFood: false });
            setEnviada(null);
          }}
        >
          Pedir otra cotización
        </Boton>
      </div>
    );
  }

  const req = (texto: string, obligatorio: boolean) => (obligatorio ? texto : `${texto} (opcional)`);

  return (
    <form
      className="formulario boleta"
      noValidate
      onSubmit={handleSubmit(async (d) => {
        setError(null);
        try {
          await api.POST("/api/v1/venue/quotes", {
            body: {
              kind: d.kind,
              name: d.name,
              email: d.email,
              phone: d.phone,
              ...(d.eventDate ? { eventDate: d.eventDate } : {}),
              ...(d.startTime ? { startTime: d.startTime } : {}),
              ...(d.durationHours ? { durationHours: Number(d.durationHours) } : {}),
              ...(d.people ? { people: Number(d.people) } : {}),
              ...(d.activityIds.length ? { activityIds: d.activityIds } : {}),
              includesFood: d.includesFood,
              ...(d.message ? { message: d.message } : {}),
              acceptPrivacy: true,
            },
          });
          setEnviada({ tipo: TIPOS.find((t) => t.valor === d.kind)?.titulo ?? "", nombre: d.name.split(" ")[0] ?? d.name });
        } catch (err) {
          setError(aplicarErrorApi(err, setCampo, [...CAMPOS], "No pudimos enviar tu solicitud. Intenta de nuevo en un momento."));
        }
      })}
    >
      {error ? <Aviso tono="error">{error}</Aviso> : null}

      <fieldset className="tipos-cotizacion" aria-describedby={e.kind ? "tipo-error" : undefined}>
        <legend>¿Qué quieres cotizar?</legend>
        <div className="tipos">
          {TIPOS.map((t) => (
            <label key={t.valor} className={cx("tipo", tipo === t.valor && "elegido")}>
              <input type="radio" value={t.valor} {...register("kind")} />
              <strong>{t.titulo}</strong>
              <span>{t.texto}</span>
            </label>
          ))}
        </div>
        {e.kind ? (
          <span className="campo-error" id="tipo-error" role="alert">
            {e.kind.message}
          </span>
        ) : null}
      </fieldset>

      {tipo ? (
        <>
          <div className="fila-3">
            <Campo
              etiqueta={req("Fecha", tipo !== "GROUP_VISIT")}
              type="date"
              min={hoy}
              {...register("eventDate")}
              error={e.eventDate?.message}
            />
            <Campo etiqueta={req("Hora de llegada", tipo === "COURT_RENTAL")} type="time" step={1800} {...register("startTime")} error={e.startTime?.message} />
            {tipo === "COURT_RENTAL" ? (
              <CampoSelect etiqueta="Horas" {...register("durationHours")} error={e.durationHours?.message}>
                <option value="">Elige</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={String(h)}>
                    {h} {h === 1 ? "hora" : "horas"}
                  </option>
                ))}
              </CampoSelect>
            ) : (
              <Campo etiqueta={req("Personas", true)} type="number" inputMode="numeric" min={1} max={2000} {...register("people")} error={e.people?.message} />
            )}
          </div>
          {tipo === "COURT_RENTAL" ? (
            <Campo etiqueta={req("Personas", false)} type="number" inputMode="numeric" min={1} max={2000} {...register("people")} error={e.people?.message} className="campo-corto" />
          ) : null}

          {actividades.length > 0 ? (
            <Controller
              control={control}
              name="activityIds"
              render={({ field }) => (
                <fieldset className="grupo-casillas">
                  <legend>{tipo === "COURT_RENTAL" ? "¿Qué quieres jugar?" : "¿Qué les gustaría hacer?"}</legend>
                  <div className="casillas-lugar">
                    {actividades.map((a) => (
                      <label key={a.id} className="casilla-lugar">
                        <input
                          type="checkbox"
                          checked={field.value.includes(a.id)}
                          onChange={(ev) => field.onChange(ev.target.checked ? [...field.value, a.id] : field.value.filter((x) => x !== a.id))}
                        />
                        {a.name}
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}
            />
          ) : null}

          <Casilla {...register("includesFood")}>Queremos comida para el grupo</Casilla>

          <div className="fila-2">
            <Campo etiqueta="Nombre" autoComplete="name" {...register("name")} error={e.name?.message} />
            <Campo etiqueta="Celular" type="tel" autoComplete="tel" {...register("phone")} error={e.phone?.message} />
          </div>
          <Campo etiqueta="Correo" type="email" autoComplete="email" {...register("email")} error={e.email?.message} />
          <CampoTexto
            etiqueta="¿Algo más que debamos saber? (opcional)"
            rows={4}
            placeholder="Si es una sorpresa, si viene gente mayor, si necesitan decoración…"
            {...register("message")}
            error={e.message?.message}
          />
          <Casilla {...register("acceptPrivacy")} error={e.acceptPrivacy?.message}>
            Acepto el <Link href="/tratamiento-de-datos">tratamiento de mis datos</Link> para que me envíen la cotización (Ley 1581 de 2012).
          </Casilla>
          <Boton type="submit" variante="accion" cargando={formState.isSubmitting}>
            Pedir cotización
          </Boton>
        </>
      ) : (
        <p className="campo-ayuda">Elige una opción para ver los datos que necesitamos.</p>
      )}
    </form>
  );
}
