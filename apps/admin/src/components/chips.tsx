"use client";

import { useState } from "react";
import { Icono } from "@telar/ui";

/** Lista de textos cortos (materiales, técnicas) editable como fichas. */
export function EntradaChips({
  etiqueta,
  valores,
  onCambio,
  sugerencias = [],
  max = 10,
}: {
  etiqueta: string;
  valores: string[];
  onCambio: (v: string[]) => void;
  sugerencias?: string[];
  max?: number;
}) {
  const [texto, setTexto] = useState("");
  const id = `chips-${etiqueta.replace(/\W+/g, "-").toLowerCase()}`;
  const agregar = () => {
    const v = texto.trim();
    if (!v || valores.some((x) => x.toLowerCase() === v.toLowerCase()) || valores.length >= max) return;
    onCambio([...valores, v]);
    setTexto("");
  };
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {valores.length > 0 ? (
        <div className="chips">
          {valores.map((v) => (
            <span key={v} className="chip">
              {v}
              <button type="button" aria-label={`Quitar ${v}`} onClick={() => onCambio(valores.filter((x) => x !== v))}>
                <Icono nombre="cerrar" width={14} height={14} />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      <div className="entrada-chips">
        <input
          id={id}
          list={`${id}-lista`}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              agregar();
            }
          }}
          disabled={valores.length >= max}
        />
        <datalist id={`${id}-lista`}>
          {sugerencias.filter((s) => !valores.includes(s)).map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <button type="button" className="boton boton-borde" onClick={agregar}>
          Agregar
        </button>
      </div>
    </div>
  );
}
