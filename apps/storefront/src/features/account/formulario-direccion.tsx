"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Aviso, Boton, Campo, CampoSelect, Casilla } from "@telar/ui";
import { MUNICIPIOS } from "@/data/municipios";
import { DEPARTAMENTOS } from "@/data/departamentos";
import { aplicarErrorApi } from "@/lib/formularios";

export const esquemaDireccion = z.object({
  recipient: z.string().trim().min(1, "¿Quién recibe?").max(120),
  phone: z.string().trim().min(7, "Escribe un celular de contacto").max(30),
  line1: z.string().trim().min(3, "Escribe la dirección").max(200),
  line2: z.string().trim().max(200).optional(),
  cityDaneCode: z.string().regex(/^\d{5}$/, "Elige el municipio"),
  postalCode: z.string().trim().max(10).optional(),
  label: z.string().trim().max(40).optional(),
  isDefault: z.boolean().optional(),
});
export type DatosDireccion = z.infer<typeof esquemaDireccion>;

/** Lo que espera el backend: la ciudad por nombre y código DANE; el departamento lo deduce él. */
export function aDireccionApi(d: DatosDireccion) {
  const nombre = MUNICIPIOS.find(([c]) => c === d.cityDaneCode)?.[1] ?? "";
  return {
    recipient: d.recipient,
    phone: d.phone,
    line1: d.line1,
    line2: d.line2 || null,
    city: nombre,
    cityDaneCode: d.cityDaneCode,
    postalCode: d.postalCode || null,
  };
}

const departamentos = Object.entries(DEPARTAMENTOS).sort((a, b) => a[1].localeCompare(b[1], "es"));

export function CamposMunicipio({
  valor,
  onCambio,
  error,
}: {
  valor: string | undefined;
  onCambio: (codigo: string) => void;
  error?: string | undefined;
}) {
  const [depto, setDepto] = useState(valor?.slice(0, 2) ?? "");
  const municipios = useMemo(() => MUNICIPIOS.filter(([c]) => c.startsWith(depto)), [depto]);
  return (
    <div className="fila-2">
      <CampoSelect
        etiqueta="Departamento"
        value={depto}
        onChange={(e) => {
          setDepto(e.target.value);
          onCambio("");
        }}
        autoComplete="address-level1"
      >
        <option value="">Elige…</option>
        {departamentos.map(([c, n]) => (
          <option key={c} value={c}>
            {n}
          </option>
        ))}
      </CampoSelect>
      <CampoSelect
        etiqueta="Municipio"
        value={valor ?? ""}
        onChange={(e) => onCambio(e.target.value)}
        disabled={!depto}
        error={error}
        autoComplete="address-level2"
      >
        <option value="">{depto ? "Elige…" : "Primero el departamento"}</option>
        {municipios.map(([c, n]) => (
          <option key={c} value={c}>
            {n}
          </option>
        ))}
      </CampoSelect>
    </div>
  );
}

export function FormularioDireccion({
  inicial,
  conEtiqueta = true,
  textoBoton = "Guardar dirección",
  onGuardar,
  onCancelar,
}: {
  inicial?: Partial<DatosDireccion>;
  conEtiqueta?: boolean;
  textoBoton?: string;
  onGuardar: (d: DatosDireccion) => Promise<void>;
  onCancelar?: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, control, setError: setCampo, formState } = useForm<DatosDireccion>({
    resolver: zodResolver(esquemaDireccion),
    defaultValues: inicial,
  });
  const e = formState.errors;
  const municipio = useWatch({ control, name: "cityDaneCode" });

  return (
    <form
      className="formulario"
      noValidate
      onSubmit={handleSubmit(async (d) => {
        setError(null);
        try {
          await onGuardar(d);
        } catch (err) {
          setError(aplicarErrorApi(err, setCampo, ["recipient", "phone", "line1", "line2", "cityDaneCode", "postalCode", "label"]));
        }
      })}
    >
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      <div className="fila-2">
        <Campo etiqueta="Quién recibe" autoComplete="name" {...register("recipient")} error={e.recipient?.message} />
        <Campo etiqueta="Celular" type="tel" inputMode="tel" autoComplete="tel" {...register("phone")} error={e.phone?.message} />
      </div>
      <Campo
        etiqueta="Dirección"
        placeholder="Calle 10 # 5-23"
        autoComplete="address-line1"
        {...register("line1")}
        error={e.line1?.message}
      />
      <Campo
        etiqueta="Apartamento, casa, barrio (opcional)"
        autoComplete="address-line2"
        {...register("line2")}
        error={e.line2?.message}
      />
      <CamposMunicipio
        valor={municipio}
        onCambio={(c) => setValue("cityDaneCode", c, { shouldValidate: formState.isSubmitted })}
        error={e.cityDaneCode?.message}
      />
      <Campo etiqueta="Código postal (opcional)" inputMode="numeric" autoComplete="postal-code" {...register("postalCode")} />
      {conEtiqueta ? (
        <div className="fila-2">
          <Campo etiqueta="Nombre de la dirección (opcional)" placeholder="Casa, oficina…" {...register("label")} />
          <Casilla {...register("isDefault")} className="casilla-alineada">
            Usarla por defecto
          </Casilla>
        </div>
      ) : null}
      <div className="acciones-fila">
        <Boton type="submit" variante="verde" cargando={formState.isSubmitting}>
          {textoBoton}
        </Boton>
        {onCancelar ? (
          <Boton variante="texto" onClick={onCancelar}>
            Cancelar
          </Boton>
        ) : null}
      </div>
    </form>
  );
}
