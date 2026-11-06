"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Boton, Cantidad, Existencias, Precio, cx } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import type { ProductDetail } from "@/lib/catalog";
import { useCarrito } from "@/features/cart/cart-context";
import { CHECKOUT_DISABLED } from "@/lib/env";

type Variante = ProductDetail["variants"][number];

/** Nombre corto de la opción: el valor del atributo si lo hay ("Gris oveja"), si no el nombre. */
const etiquetaVariante = (v: Variante) => Object.values(v.attributes)[0] ?? v.name;
const MAX_POR_LINEA = 10;

export function FichaProducto({ producto }: { producto: ProductDetail }) {
  const variantes = producto.variants;
  const inicial = variantes.find((v) => v.availability !== "OUT_OF_STOCK") ?? variantes[0];
  const [varianteId, setVarianteId] = useState(inicial?.id);
  const variante = variantes.find((v) => v.id === varianteId) ?? inicial;
  const [cantidad, setCantidad] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { agregar } = useCarrito();

  // Fotos: las de la variante elegida primero, luego las generales.
  const fotos = useMemo(() => {
    const propias = producto.images.filter((i) => i.variantId === variante?.id);
    const generales = producto.images.filter((i) => !i.variantId);
    const resto = producto.images.filter((i) => i.variantId && i.variantId !== variante?.id);
    return [...propias, ...generales, ...resto];
  }, [producto.images, variante?.id]);
  const [fotoId, setFotoId] = useState<string | undefined>(undefined);
  const foto = fotos.find((f) => f.id === fotoId) ?? fotos[0];

  const agotada = !variante || variante.availability === "OUT_OF_STOCK";
  const atributo = Object.keys(variantes[0]?.attributes ?? {})[0];

  return (
    <div className="ficha">
      <div className="galeria">
        <div className="principal foto-real">
          {foto ? (
            <Image src={foto.url} alt={foto.altText ?? producto.name} fill priority sizes="(max-width: 900px) 100vw, 58vw" />
          ) : null}
        </div>
        {fotos.length > 1 ? (
          <ul className="miniaturas" aria-label="Fotos de la pieza">
            {fotos.slice(0, 8).map((f, i) => (
              <li key={f.id}>
                <button
                  type="button"
                  aria-current={f.id === foto?.id}
                  aria-label={`Ver foto ${i + 1}${f.altText ? `: ${f.altText}` : ""}`}
                  onClick={() => setFotoId(f.id)}
                >
                  <Image src={f.url} alt="" fill sizes="120px" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <form
        className="tabla"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!variante || agotada) return;
          setEnviando(true);
          setError(null);
          try {
            await agregar(variante.id, cantidad);
          } catch (err) {
            setError(errorMessage(err, "No pudimos agregarla al carrito. Intenta de nuevo."));
          } finally {
            setEnviando(false);
          }
        }}
      >
        <h1>{producto.name}</h1>
        {producto.artisan ? (
          <p className="tejedor">
            Tejida en telar por <Link href={`/artesanos/${producto.artisan.slug}`}>{producto.artisan.name}</Link>
          </p>
        ) : null}
        {variante ? (
          <p className="precio-pintado">
            <Precio valor={variante.price} antes={variante.compareAtPrice} />
          </p>
        ) : null}
        <p className="nota-iva">IVA incluido · Envío a toda Colombia</p>

        {variantes.length > 1 ? (
          <fieldset className="opciones">
            <legend>
              {atributo ? atributo.charAt(0).toUpperCase() + atributo.slice(1) : "Opción"}:{" "}
              {variante ? etiquetaVariante(variante) : ""}
            </legend>
            <div className="muestras">
              {variantes.map((v) => {
                const img = producto.images.find((i) => i.variantId === v.id);
                return (
                  <label key={v.id} className={cx("muestra", img && "con-foto")} title={etiquetaVariante(v)}>
                    <input
                      type="radio"
                      name="variante"
                      value={v.id}
                      checked={v.id === variante?.id}
                      onChange={() => {
                        setVarianteId(v.id);
                        setFotoId(undefined);
                        setCantidad(1);
                      }}
                      aria-label={`${etiquetaVariante(v)}${v.availability === "OUT_OF_STOCK" ? ", agotada" : ""}`}
                    />
                    <span>{img ? <Image src={img.url} alt="" width={52} height={36} /> : etiquetaVariante(v)}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {variante ? <Existencias disponibilidad={variante.availability} /> : null}

        <div className="compra">
          <Cantidad valor={cantidad} max={MAX_POR_LINEA} onCambio={setCantidad} disabled={agotada || CHECKOUT_DISABLED} />
          <Boton type="submit" variante="accion" cargando={enviando} disabled={agotada || CHECKOUT_DISABLED}>
            {CHECKOUT_DISABLED ? "Tienda en mantenimiento" : agotada ? "Agotada" : "Agregar al carrito"}
          </Boton>
        </div>
        {error ? (
          <p className="campo-error" role="alert">
            {error}
          </p>
        ) : null}

        <ul className="garantias">
          <li>
            <Link href="/envios">Envíos a toda Colombia</Link>
          </li>
          <li>
            <Link href="/cambios-y-devoluciones">Cambios y devoluciones</Link> · <Link href="/derecho-de-retracto">Derecho de retracto</Link>
          </li>
          <li>Pago seguro con Wompi: tarjeta, PSE o Nequi</li>
        </ul>
      </form>
    </div>
  );
}
