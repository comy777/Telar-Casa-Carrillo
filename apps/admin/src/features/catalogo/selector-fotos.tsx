"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Boton, Icono, cx } from "@telar/ui";
import { Insignia } from "@/components/base";
import { MAX_FOTOS_PRODUCTO, TIPOS_IMAGEN, validarImagen } from "@/lib/archivos";

/**
 * Elige fotos antes de que el producto exista: las muestra, deja ordenarlas y quitarlas.
 * Se suben al crear el producto, en este orden; la primera queda como principal.
 */
export function SelectorFotos({ fotos, onCambio, deshabilitado = false }: { fotos: File[]; onCambio: (f: File[]) => void; deshabilitado?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const vistas = useMemo(() => fotos.map((f) => URL.createObjectURL(f)), [fotos]);
  useEffect(() => () => vistas.forEach((u) => URL.revokeObjectURL(u)), [vistas]);

  const agregar = (archivos: File[]) => {
    const problemas: string[] = [];
    const validos = archivos.filter((f) => {
      const p = validarImagen(f);
      if (p) problemas.push(`${f.name}: ${p}`);
      return !p;
    });
    const cupo = MAX_FOTOS_PRODUCTO - fotos.length;
    if (validos.length > cupo) problemas.push(`Un producto puede tener hasta ${MAX_FOTOS_PRODUCTO} fotos; quedaron fuera ${validos.length - cupo}.`);
    setError(problemas.length ? problemas.join(" ") : null);
    if (cupo > 0 && validos.length) onCambio([...fotos, ...validos.slice(0, cupo)]);
  };
  const mover = (desde: number, hasta: number) => {
    const copia = [...fotos];
    const [f] = copia.splice(desde, 1);
    if (f) copia.splice(hasta, 0, f);
    onCambio(copia);
  };

  return (
    <div className="selector-fotos">
      {fotos.length > 0 ? (
        <ol className="galeria-admin" aria-label="Fotos elegidas">
          {fotos.map((f, i) => (
            <li key={vistas[i]} className={cx("foto-admin", i === 0 && "principal")}>
              <div className="marco-foto">
                <Image src={vistas[i] ?? ""} alt={`Vista previa de ${f.name}`} fill sizes="160px" unoptimized />
              </div>
              <span className="nombre-foto" title={f.name}>
                {f.name}
              </span>
              <div className="acciones-fila">
                {i === 0 ? (
                  <Insignia tono="lleno">Principal</Insignia>
                ) : (
                  <Boton variante="texto" disabled={deshabilitado} onClick={() => mover(i, 0)}>
                    Principal
                  </Boton>
                )}
                <Boton variante="texto" disabled={deshabilitado || i === 0} aria-label={`Mover ${f.name} antes`} onClick={() => mover(i, i - 1)}>
                  <Icono nombre="chevron-izq" width={16} height={16} />
                </Boton>
                <Boton variante="texto" disabled={deshabilitado} aria-label={`Quitar ${f.name}`} onClick={() => onCambio(fotos.filter((_, j) => j !== i))}>
                  <Icono nombre="basura" width={16} height={16} />
                </Boton>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      <div className="subir-imagen">
        <input
          ref={input}
          type="file"
          accept={TIPOS_IMAGEN}
          multiple
          className="sr"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            agregar(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
        <Boton variante="borde" disabled={deshabilitado || fotos.length >= MAX_FOTOS_PRODUCTO} onClick={() => input.current?.click()}>
          <Icono nombre="subir" /> {fotos.length ? "Agregar más fotos" : "Elegir fotos"}
        </Boton>
        <span className="campo-ayuda">
          JPEG, PNG o WebP, hasta 5 MB cada una. {fotos.length ? `${fotos.length} de ${MAX_FOTOS_PRODUCTO}.` : "Puedes elegir varias a la vez."}
        </span>
        {error ? (
          <span className="campo-error" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    </div>
  );
}
