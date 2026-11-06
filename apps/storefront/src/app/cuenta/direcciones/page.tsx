"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, EstadoVacio, Esqueleto } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { AreaCuenta } from "@/features/account/area-cuenta";
import { aDireccionApi, FormularioDireccion } from "@/features/account/formulario-direccion";
import { TextoDireccion } from "@/features/account/texto-direccion";

const CLAVE = ["direcciones"];

export default function Direcciones() {
  const qc = useQueryClient();
  const [editando, setEditando] = useState<string | "nueva" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lista = useQuery({ queryKey: CLAVE, queryFn: async () => (await api.GET("/api/v1/account/addresses")).data ?? [] });
  const recargar = () => qc.invalidateQueries({ queryKey: CLAVE });

  return (
    <AreaCuenta titulo="Direcciones">
      {error ? <Aviso tono="error">{error}</Aviso> : null}
      {lista.isPending ? (
        <Esqueleto alto={200} />
      ) : (lista.data ?? []).length === 0 && editando !== "nueva" ? (
        <EstadoVacio
          titulo="Aún no guardas direcciones"
          accion={
            <Boton variante="verde" onClick={() => setEditando("nueva")}>
              Agregar dirección
            </Boton>
          }
        >
          <p>Guárdalas para pagar más rápido la próxima vez.</p>
        </EstadoVacio>
      ) : (
        <ul className="lista-direcciones">
          {(lista.data ?? []).map((d) => (
            <li key={d.id} className="tarjeta-cuenta">
              {editando === d.id ? (
                <FormularioDireccion
                  inicial={{ ...d, line2: d.line2 ?? "", postalCode: d.postalCode ?? "", label: d.label ?? "" }}
                  onCancelar={() => setEditando(null)}
                  onGuardar={async (datos) => {
                    await api.PUT("/api/v1/account/addresses/{id}", {
                      params: { path: { id: d.id } },
                      body: { ...aDireccionApi(datos), label: datos.label || null, isDefault: datos.isDefault ?? false },
                    });
                    setEditando(null);
                    await recargar();
                  }}
                />
              ) : (
                <>
                  <div className="direccion-cabeza">
                    <span className="direccion-etiqueta">{d.label ?? "Dirección"}</span>
                    {d.isDefault ? <span className="insignia">Por defecto</span> : null}
                  </div>
                  <TextoDireccion d={d} />
                  <div className="acciones-fila">
                    <Boton variante="texto" onClick={() => setEditando(d.id)}>
                      Editar
                    </Boton>
                    <Boton
                      variante="texto"
                      onClick={async () => {
                        if (!window.confirm("¿Borrar esta dirección?")) return;
                        setError(null);
                        try {
                          await api.DELETE("/api/v1/account/addresses/{id}", { params: { path: { id: d.id } } });
                          await recargar();
                        } catch (e) {
                          setError(errorMessage(e));
                        }
                      }}
                    >
                      Borrar
                    </Boton>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {editando === "nueva" ? (
        <section className="tarjeta-cuenta" aria-labelledby="t-nueva">
          <h2 id="t-nueva">Nueva dirección</h2>
          <FormularioDireccion
            onCancelar={() => setEditando(null)}
            onGuardar={async (datos) => {
              await api.POST("/api/v1/account/addresses", {
                body: { ...aDireccionApi(datos), label: datos.label || null, isDefault: datos.isDefault ?? false },
              });
              setEditando(null);
              await recargar();
            }}
          />
        </section>
      ) : (lista.data ?? []).length > 0 ? (
        <Boton variante="borde" onClick={() => setEditando("nueva")}>
          Agregar otra dirección
        </Boton>
      ) : null}
    </AreaCuenta>
  );
}
