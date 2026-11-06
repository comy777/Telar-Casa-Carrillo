"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Aviso, Boton, Campo, CampoSelect, CampoTexto, Casilla, EstadoVacio, Esqueleto, claseBoton, formatoPesos } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { useCarrito, CLAVE_CARRITO } from "@/features/cart/cart-context";
import { useSesion } from "@/features/auth/session-context";
import { aDireccionApi, CamposMunicipio, esquemaDireccion } from "@/features/account/formulario-direccion";
import { TextoDireccion } from "@/features/account/texto-direccion";
import { guardarTokenPedido } from "@/lib/pedido-invitado";
import { aplicarErrorApi } from "@/lib/formularios";
import { CHECKOUT_DISABLED } from "@/lib/env";

const TIPOS_DOC = [
  ["CC", "Cédula de ciudadanía"],
  ["CE", "Cédula de extranjería"],
  ["NIT", "NIT"],
  ["PP", "Pasaporte"],
  ["PPT", "Permiso de protección temporal"],
  ["TI", "Tarjeta de identidad"],
] as const;

const esquema = z
  .object({
    email: z.string().trim().email("Escribe un correo válido").optional().or(z.literal("")),
    customerName: z.string().trim().min(3, "Escribe tu nombre completo").max(160),
    phone: z.string().trim().min(7, "Escribe un celular de contacto").max(30),
    docType: z.enum(["", "CC", "CE", "NIT", "PP", "PPT", "TI"]).optional(),
    docNumber: z.string().trim().max(20).optional(),
    addressId: z.string().optional(),
    direccion: esquemaDireccion.omit({ label: true, isDefault: true }).partial().optional(),
    shippingMethodId: z.string().min(1, "Elige cómo quieres recibirlo"),
    notes: z.string().trim().max(500).optional(),
    acceptTerms: z.literal(true, { message: "Debes aceptar los términos y condiciones" }),
  })
  .superRefine((d, ctx) => {
    if (d.docType && !d.docNumber) ctx.addIssue({ code: "custom", path: ["docNumber"], message: "Escribe el número de documento" });
    if (!d.addressId) {
      const r = esquemaDireccion.omit({ label: true, isDefault: true }).safeParse(d.direccion ?? {});
      if (!r.success) for (const i of r.error.issues) ctx.addIssue({ ...i, path: ["direccion", ...i.path] });
    }
  });
type Datos = z.infer<typeof esquema>;

export default function Checkout() {
  const router = useRouter();
  const qc = useQueryClient();
  const { carrito, cargando } = useCarrito();
  const { estado, usuario } = useSesion();
  const conectado = estado === "conectado";
  const [cupon, setCupon] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const metodos = useQuery({ queryKey: ["metodos-envio"], queryFn: async () => (await api.GET("/api/v1/shipping/methods")).data ?? [] });
  const direcciones = useQuery({
    queryKey: ["direcciones"],
    queryFn: async () => (await api.GET("/api/v1/account/addresses")).data ?? [],
    enabled: conectado,
  });

  const { register, handleSubmit, control, setValue, setError: setCampo, formState } = useForm<Datos>({
    resolver: zodResolver(esquema),
    defaultValues: { docType: "", direccion: {} },
  });
  const e = formState.errors;
  const metodoId = useWatch({ control, name: "shippingMethodId" });
  const email = useWatch({ control, name: "email" });
  const addressId = useWatch({ control, name: "addressId" });
  const municipio = useWatch({ control, name: "direccion.cityDaneCode" });

  // Valores por defecto cuando cargan la sesión, las direcciones y los métodos.
  useEffect(() => {
    if (usuario) setValue("customerName", `${usuario.firstName} ${usuario.lastName}`.trim());
  }, [usuario, setValue]);
  useEffect(() => {
    const def = direcciones.data?.find((d) => d.isDefault) ?? direcciones.data?.[0];
    if (def && !addressId) setValue("addressId", def.id);
  }, [direcciones.data, addressId, setValue]);
  useEffect(() => {
    const primero = metodos.data?.[0];
    if (primero && !metodoId) setValue("shippingMethodId", primero.id);
  }, [metodos.data, metodoId, setValue]);

  const cotizacion = useQuery({
    queryKey: ["cotizacion", metodoId, cuponAplicado, conectado ? null : email, carrito?.subtotal, carrito?.itemCount],
    queryFn: async () =>
      (
        await api.POST("/api/v1/checkout/quote", {
          body: {
            shippingMethodId: metodoId || undefined,
            couponCode: cuponAplicado,
            email: !conectado && email ? email : undefined,
          },
        })
      ).data,
    enabled: Boolean(carrito && carrito.lines.length > 0),
    retry: false,
  });
  const totales = cotizacion.data?.totals;
  const errorCupon = cuponAplicado && cotizacion.error ? errorMessage(cotizacion.error) : null;

  const metodoElegido = useMemo(() => metodos.data?.find((m) => m.id === metodoId), [metodos.data, metodoId]);

  if (cargando) {
    return (
      <main className="envoltura checkout">
        <Esqueleto alto={400} />
      </main>
    );
  }
  if (!carrito || carrito.lines.length === 0) {
    return (
      <main className="envoltura checkout">
        <EstadoVacio
          titulo="Tu carrito está vacío"
          accion={
            <Link href="/productos" className={claseBoton("verde")}>
              Ver el catálogo
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <main className="envoltura checkout">
      <p className="migas">
        <Link href="/carrito">Carrito</Link> / Pago
      </p>
      <h1 className="titulo-pagina">Finaliza tu compra</h1>
      {CHECKOUT_DISABLED ? <Aviso tono="info">La tienda está en mantenimiento. Intenta pagar en un rato.</Aviso> : null}

      <form
        className="checkout-cuerpo"
        noValidate
        onSubmit={handleSubmit(async (d) => {
          setError(null);
          try {
            const { data } = await api.POST("/api/v1/checkout/orders", {
              body: {
                email: conectado ? undefined : d.email || undefined,
                customerName: d.customerName,
                phone: d.phone,
                document: d.docType && d.docNumber ? { type: d.docType, number: d.docNumber } : undefined,
                addressId: d.addressId || undefined,
                shippingAddress: d.addressId ? undefined : aDireccionApi(esquemaDireccion.parse({ ...d.direccion })),
                shippingMethodId: d.shippingMethodId,
                couponCode: cuponAplicado,
                notes: d.notes || null,
                acceptTerms: true,
              },
            });
            if (!data) throw new Error("Respuesta vacía");
            if (data.accessToken) guardarTokenPedido(data.order.orderNumber, data.accessToken);
            await qc.invalidateQueries({ queryKey: CLAVE_CARRITO });
            router.push(`/pedido/${data.order.orderNumber}/pago`);
          } catch (err) {
            setError(aplicarErrorApi(err, setCampo, ["email", "customerName", "phone", "docNumber", "shippingMethodId"]));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        })}
      >
        <div className="pasadas">
          {error ? <Aviso tono="error">{error}</Aviso> : null}

          <fieldset className="pasada">
            <legend>
              <span className="pasada-num" aria-hidden="true">1</span> Tus datos
            </legend>
            {conectado ? (
              <p className="nota">
                Compras como <strong>{usuario?.email}</strong>.
              </p>
            ) : (
              <>
                <Campo
                  etiqueta="Correo"
                  type="email"
                  autoComplete="email"
                  ayuda="Te enviamos la confirmación y el seguimiento del pedido."
                  {...register("email")}
                  error={e.email?.message}
                />
                <p className="nota">
                  ¿Ya tienes cuenta? <Link href="/cuenta/ingresar?volver=/checkout">Ingresa</Link> para usar tus direcciones.
                </p>
              </>
            )}
            <div className="fila-2">
              <Campo etiqueta="Nombre completo" autoComplete="name" {...register("customerName")} error={e.customerName?.message} />
              <Campo etiqueta="Celular" type="tel" inputMode="tel" autoComplete="tel" {...register("phone")} error={e.phone?.message} />
            </div>
            <details className="factura">
              <summary>¿Necesitas la factura a tu nombre? (opcional)</summary>
              <p className="nota">Sin documento, la factura electrónica sale a consumidor final.</p>
              <div className="fila-2">
                <CampoSelect etiqueta="Tipo de documento" {...register("docType")}>
                  <option value="">Ninguno</option>
                  {TIPOS_DOC.map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </CampoSelect>
                <Campo etiqueta="Número" inputMode="numeric" {...register("docNumber")} error={e.docNumber?.message} />
              </div>
            </details>
          </fieldset>

          <fieldset className="pasada">
            <legend>
              <span className="pasada-num" aria-hidden="true">2</span> Dirección de entrega
            </legend>
            {conectado && (direcciones.data?.length ?? 0) > 0 ? (
              <div className="opciones-radio">
                {direcciones.data!.map((d) => (
                  <label key={d.id} className="opcion-radio">
                    <input type="radio" value={d.id} {...register("addressId")} />
                    <TextoDireccion d={d} />
                  </label>
                ))}
                <label className="opcion-radio">
                  <input type="radio" value="" {...register("addressId")} />
                  <span>Otra dirección</span>
                </label>
              </div>
            ) : null}
            {!addressId ? (
              <div className="formulario">
                <div className="fila-2">
                  <Campo etiqueta="Quién recibe" autoComplete="name" {...register("direccion.recipient")} error={e.direccion?.recipient?.message} />
                  <Campo etiqueta="Celular de quien recibe" type="tel" autoComplete="tel" {...register("direccion.phone")} error={e.direccion?.phone?.message} />
                </div>
                <Campo etiqueta="Dirección" placeholder="Calle 10 # 5-23" autoComplete="address-line1" {...register("direccion.line1")} error={e.direccion?.line1?.message} />
                <Campo etiqueta="Apartamento, casa, barrio (opcional)" autoComplete="address-line2" {...register("direccion.line2")} />
                <CamposMunicipio
                  valor={municipio}
                  onCambio={(c) => setValue("direccion.cityDaneCode", c, { shouldValidate: formState.isSubmitted })}
                  error={e.direccion?.cityDaneCode?.message}
                />
              </div>
            ) : null}
            <CampoTexto etiqueta="Indicaciones para la entrega (opcional)" rows={2} {...register("notes")} />
          </fieldset>

          <fieldset className="pasada">
            <legend>
              <span className="pasada-num" aria-hidden="true">3</span> Envío
            </legend>
            {metodos.isPending ? (
              <Esqueleto alto={80} />
            ) : (metodos.data?.length ?? 0) === 0 ? (
              <Aviso tono="error">No hay métodos de envío disponibles en este momento.</Aviso>
            ) : (
              <div className="opciones-radio">
                {metodos.data!.map((m) => (
                  <label key={m.id} className="opcion-radio">
                    <input type="radio" value={m.id} {...register("shippingMethodId")} />
                    <span className="opcion-texto">
                      <strong>{m.name}</strong>
                      {m.estimatedDelivery ? <span>{m.estimatedDelivery}</span> : null}
                      {m.freeShippingThreshold ? <span>Gratis desde {formatoPesos(m.freeShippingThreshold)}</span> : null}
                    </span>
                    <span className="opcion-precio">{formatoPesos(m.basePrice)}</span>
                  </label>
                ))}
              </div>
            )}
            {e.shippingMethodId ? <p className="campo-error">{e.shippingMethodId.message}</p> : null}
          </fieldset>
        </div>

        <aside className="tabla resumen" aria-labelledby="t-resumen">
          <h2 id="t-resumen">Tu pedido</h2>
          <ul className="resumen-lineas">
            {carrito.lines.map((l) => (
              <li key={l.variantId}>
                <span>
                  {l.quantity} × {l.product?.productName ?? "Pieza"}
                </span>
                <span>{formatoPesos(l.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="cupon">
            <label htmlFor="cupon">Cupón</label>
            <div className="fila">
              <input id="cupon" value={cupon} onChange={(ev) => setCupon(ev.target.value.toUpperCase())} autoComplete="off" />
              <button type="button" className="boton boton-claro" onClick={() => setCuponAplicado(cupon.trim() || null)}>
                Aplicar
              </button>
            </div>
            {errorCupon ? <p className="campo-error">{errorCupon}</p> : null}
            {cotizacion.data?.coupon ? <p className="nota">Cupón {cotizacion.data.coupon.code} aplicado.</p> : null}
          </div>

          {totales ? (
            <dl className="totales totales-tabla" aria-live="polite">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatoPesos(totales.subtotal)}</dd>
              </div>
              {totales.discount > 0 ? (
                <div>
                  <dt>Descuento</dt>
                  <dd>− {formatoPesos(totales.discount)}</dd>
                </div>
              ) : null}
              <div>
                <dt>Envío{metodoElegido ? ` · ${metodoElegido.name}` : ""}</dt>
                <dd>{totales.shipping === 0 && metodoElegido ? "Gratis" : formatoPesos(totales.shipping)}</dd>
              </div>
              <div className="total">
                <dt>Total</dt>
                <dd>{formatoPesos(totales.total)}</dd>
              </div>
              <div className="iva">
                <dt>IVA incluido</dt>
                <dd>{formatoPesos(totales.tax)}</dd>
              </div>
            </dl>
          ) : (
            <Esqueleto alto={120} />
          )}

          <Casilla {...register("acceptTerms")} error={e.acceptTerms?.message}>
            Acepto los <Link href="/terminos-y-condiciones">términos y condiciones</Link> y la{" "}
            <Link href="/tratamiento-de-datos">política de datos</Link>. Conozco mi{" "}
            <Link href="/derecho-de-retracto">derecho de retracto</Link>.
          </Casilla>
          <Boton
            type="submit"
            variante="accion"
            cargando={formState.isSubmitting}
            disabled={CHECKOUT_DISABLED || !cotizacion.data?.canCheckout}
          >
            Confirmar y pagar
          </Boton>
          <p className="nota-iva">Las piezas quedan apartadas mientras pagas. El pago se hace en Wompi (tarjeta, PSE o Nequi).</p>
        </aside>
      </form>
    </main>
  );
}
