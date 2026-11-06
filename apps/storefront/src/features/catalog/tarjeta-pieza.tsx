import Image from "next/image";
import Link from "next/link";
import { cx, formatoPesos, textoDisponibilidad } from "@telar/ui";
import type { ProductCard } from "@/lib/catalog";

/** Tarjeta de pieza: foto con el doblez de la lana y la etiqueta de precio pintada encima. */
export function TarjetaPieza({ pieza, prioridad = false }: { pieza: ProductCard; prioridad?: boolean }) {
  const agotada = pieza.availability === "OUT_OF_STOCK";
  return (
    <li className={cx("pieza", agotada && "agotada")}>
      <Link href={`/productos/${pieza.slug}`}>
        <div className="foto-pieza foto-real">
          {pieza.image ? (
            <Image
              src={pieza.image.url}
              alt={pieza.image.altText ?? pieza.name}
              fill
              sizes="(max-width: 600px) 50vw, (max-width: 1200px) 33vw, 320px"
              priority={prioridad}
            />
          ) : null}
        </div>
        <div className="etiqueta">
          <strong>
            {pieza.hasMultipleVariants ? <span className="desde">Desde </span> : null}
            {formatoPesos(pieza.price)}
          </strong>
          {pieza.compareAtPrice && pieza.compareAtPrice > pieza.price ? (
            <s>
              <span className="sr">Antes </span>
              {formatoPesos(pieza.compareAtPrice)}
            </s>
          ) : null}
        </div>
        <h3>{pieza.name}</h3>
        <p>
          {textoDisponibilidad(pieza.availability)}
          {pieza.artisan ? ` · Tejida por ${pieza.artisan.name}` : null}
        </p>
      </Link>
    </li>
  );
}

export function ListaPiezas({ piezas, prioridad = 0 }: { piezas: ProductCard[]; prioridad?: number }) {
  return (
    <ul className="piezas">
      {piezas.map((p, i) => (
        <TarjetaPieza key={p.id} pieza={p} prioridad={i < prioridad} />
      ))}
    </ul>
  );
}
