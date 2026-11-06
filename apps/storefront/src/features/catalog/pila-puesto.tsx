"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Existencias, Precio, cx } from "@telar/ui";
import type { ProductCard } from "@/lib/catalog";
import { BotonAgregarRapido } from "@/features/cart/boton-agregar";

/**
 * La firma del inicio: piezas apiladas como en el puesto de la plaza. Tocar (o pasar el
 * mouse sobre) una banda la despliega y la tabla pintada muestra esa pieza.
 */
export function PilaPuesto({ piezas }: { piezas: ProductCard[] }) {
  const [activa, setActiva] = useState(0);
  const espera = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (espera.current) clearTimeout(espera.current);
    };
  }, []);

  const pieza = piezas[activa] ?? piezas[0];
  if (!pieza) return null;

  return (
    <section className="puesto" aria-labelledby="pieza-actual">
      <div className="envoltura">
        <div>
          <h2 className="sr">Piezas del puesto</h2>
          <ul className="pila" onPointerLeave={() => espera.current && clearTimeout(espera.current)}>
            {piezas.map((p, i) => (
              <li key={p.id}>
                <button
                  type="button"
                  className={cx("banda", "con-foto")}
                  aria-pressed={i === activa}
                  aria-label={`${p.name}: ver en la tabla`}
                  onClick={() => setActiva(i)}
                  onPointerEnter={(e) => {
                    // Solo con mouse: en pantallas táctiles la banda se elige al tocarla.
                    if (e.pointerType !== "mouse") return;
                    if (espera.current) clearTimeout(espera.current);
                    espera.current = setTimeout(() => setActiva(i), 120);
                  }}
                >
                  {p.image ? (
                    <Image
                      src={p.image.url}
                      alt=""
                      fill
                      sizes="(max-width: 900px) 100vw, 60vw"
                      priority={i === 0}
                      className="banda-foto"
                    />
                  ) : null}
                  <span className="rotulo" aria-hidden="true">
                    {p.name}
                    <small>
                      <Precio valor={p.price} />
                    </small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <aside className="tabla" aria-live="polite">
          <h1 id="pieza-actual">{pieza.name}</h1>
          {pieza.artisan ? (
            <p className="tejedor">
              Tejida en telar por <Link href={`/artesanos/${pieza.artisan.slug}`}>{pieza.artisan.name}</Link>
            </p>
          ) : null}
          <p className="precio-pintado">
            {pieza.hasMultipleVariants ? <span className="desde">Desde </span> : null}
            <Precio valor={pieza.price} antes={pieza.compareAtPrice} />
          </p>
          <p className="nota-iva">IVA incluido · Envío a toda Colombia</p>
          <Existencias disponibilidad={pieza.availability} />
          {pieza.hasMultipleVariants ? (
            <Link className="boton boton-accion" href={`/productos/${pieza.slug}`}>
              Elegir color y comprar
            </Link>
          ) : (
            <BotonAgregarRapido slug={pieza.slug} agotada={pieza.availability === "OUT_OF_STOCK"} />
          )}
          <Link className="ver-mas" href={`/productos/${pieza.slug}`}>
            Ver la pieza completa
          </Link>
        </aside>
      </div>
      <div className="zocalo" aria-hidden="true" />
    </section>
  );
}
