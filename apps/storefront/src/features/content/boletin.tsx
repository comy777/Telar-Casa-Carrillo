"use client";

import Link from "next/link";
import { useState } from "react";
import { Boton } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { api } from "@/lib/api-browser";

export function Boletin() {
  const [correo, setCorreo] = useState("");
  const [acepta, setAcepta] = useState(false);
  const [estado, setEstado] = useState<"listo" | "enviando" | "enviado">("listo");
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="seccion boletin" aria-labelledby="t-boletin">
      <div className="envoltura">
        <div>
          <h2 className="titulo" id="t-boletin">
            Avísame cuando salga algo nuevo del telar
          </h2>
          <p>Un correo cuando haya piezas nuevas. Nada más, y puedes salirte cuando quieras.</p>
        </div>
        {estado === "enviado" ? (
          <p role="status" className="boletin-ok">
            Listo. Te enviamos un correo a <strong>{correo}</strong>: abre el enlace para confirmar la suscripción.
          </p>
        ) : (
          <form
            noValidate
            onSubmit={async (e) => {
              e.preventDefault();
              setError(null);
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return setError("Escribe un correo válido.");
              if (!acepta) return setError("Para suscribirte debes aceptar el tratamiento de datos.");
              setEstado("enviando");
              try {
                await api.POST("/api/v1/content/newsletter", { body: { email: correo, acceptPrivacy: true } });
                setEstado("enviado");
              } catch (err) {
                setError(errorMessage(err));
                setEstado("listo");
              }
            }}
          >
            <label className="sr" htmlFor="correo-boletin">
              Correo electrónico
            </label>
            <div className="fila">
              <input
                id="correo-boletin"
                type="email"
                placeholder="tu@correo.com"
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                aria-invalid={error ? true : undefined}
              />
              <Boton type="submit" variante="accion" cargando={estado === "enviando"}>
                Suscribirme
              </Boton>
            </div>
            <label className="consentimiento">
              <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
              <span>
                Acepto el <Link href="/tratamiento-de-datos">tratamiento de mis datos</Link> (Ley 1581 de 2012).
              </span>
            </label>
            {error ? (
              <p className="campo-error boletin-error" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </section>
  );
}
