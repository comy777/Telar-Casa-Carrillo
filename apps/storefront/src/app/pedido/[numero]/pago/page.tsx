"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Aviso, Boton, Esqueleto, claseBoton, formatoPesos } from "@telar/ui";
import { errorMessage, type Schema } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { activarTokenPedido } from "@/lib/pedido-invitado";
import { useSesion } from "@/features/auth/session-context";
import { ESTADOS, fecha } from "@/features/orders/detalle-pedido";

type Pedido = Schema<"OrderResponse">;
type Fase = "cargando" | "listo" | "confirmando" | "resultado" | "error";

/**
 * Paso de pago y regreso desde Wompi (STOREFRONT_URL/pedido/:numero/pago?id=<transacción>).
 * El estado del pago siempre lo decide el backend consultando a Wompi, nunca el navegador.
 */
export default function PagoPedido({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = use(params);
  const qc = useQueryClient();
  const { estado } = useSesion();
  const [fase, setFase] = useState<Fase>("cargando");
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [iniciando, setIniciando] = useState(false);
  const hecho = useRef(false);

  const urlPedido = estado === "conectado" ? `/cuenta/pedidos/${numero}` : `/pedido/${numero}`;

  useEffect(() => {
    if (hecho.current || estado === "cargando") return;
    hecho.current = true;
    activarTokenPedido(numero);
    const url = new URL(window.location.href);
    const transaccion = url.searchParams.get("id");
    (async () => {
      try {
        if (transaccion) {
          setFase("confirmando");
          url.searchParams.delete("id");
          window.history.replaceState(window.history.state, "", url.pathname);
          const { data } = await api.POST("/api/v1/orders/{orderNumber}/payments/confirm", {
            params: { path: { orderNumber: numero } },
            body: { transactionId: transaccion },
          });
          setPedido(data ?? null);
          setFase("resultado");
          void qc.invalidateQueries();
        } else {
          const { data } =
            estado === "conectado"
              ? await api.GET("/api/v1/account/orders/{orderNumber}", { params: { path: { orderNumber: numero } } })
              : await api.GET("/api/v1/orders/{orderNumber}", { params: { path: { orderNumber: numero } } });
          setPedido(data ?? null);
          setFase(data && data.status !== "PENDING_PAYMENT" ? "resultado" : "listo");
        }
      } catch (e) {
        setError(errorMessage(e, "No pudimos abrir el pago de este pedido."));
        setFase("error");
      }
    })();
  }, [numero, estado, qc]);

  const pagar = async () => {
    setIniciando(true);
    setError(null);
    try {
      const { data } = await api.POST("/api/v1/orders/{orderNumber}/payments", {
        params: { path: { orderNumber: numero } },
        body: {},
      });
      if (data?.kind === "free" && data.order) {
        setPedido(data.order);
        setFase("resultado");
      } else if (data?.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      } else throw new Error("sin url");
    } catch (e) {
      setError(errorMessage(e, "No pudimos conectar con Wompi. Intenta de nuevo en un momento."));
    }
    setIniciando(false);
  };

  if (fase === "cargando" || fase === "confirmando") {
    return (
      <main className="envoltura acceso" aria-busy="true">
        <div className="tabla acceso-tabla">
          <h1>{fase === "confirmando" ? "Confirmando tu pago…" : "Preparando tu pago…"}</h1>
          <p>Estamos consultando a la pasarela. No cierres esta ventana.</p>
          <Esqueleto alto={8} />
        </div>
      </main>
    );
  }

  if (fase === "error") {
    return (
      <main className="envoltura acceso">
        <div className="tabla acceso-tabla">
          <h1>No pudimos abrir el pago</h1>
          <Aviso tono="error">{error}</Aviso>
          <Link href={urlPedido} className={claseBoton("claro")}>
            Ver el pedido
          </Link>
        </div>
      </main>
    );
  }

  if (fase === "resultado" && pedido) {
    const pagado = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(pedido.status);
    const pendiente = pedido.status === "PENDING_PAYMENT";
    return (
      <main className="envoltura acceso">
        <div className="tabla acceso-tabla">
          <h1>{pagado ? "¡Gracias! Recibimos tu pago" : pendiente ? "Tu pago aún no se confirma" : `Pedido ${ESTADOS[pedido.status].toLowerCase()}`}</h1>
          <p>
            Pedido <strong>{pedido.orderNumber}</strong> · {formatoPesos(pedido.totals.total)}
          </p>
          {pagado ? (
            <p>Te enviamos la confirmación a {pedido.customerEmail}. La familia empieza a preparar tus piezas.</p>
          ) : pendiente ? (
            <>
              <p>
                Si pagaste con PSE o Nequi puede tardar unos minutos; te avisaremos por correo. Si el pago fue rechazado, puedes
                intentarlo de nuevo{pedido.paymentDueAt ? ` antes del ${fecha(pedido.paymentDueAt, true)}` : ""}.
              </p>
              {error ? <Aviso tono="error">{error}</Aviso> : null}
              <Boton variante="accion" cargando={iniciando} onClick={pagar}>
                Intentar el pago de nuevo
              </Boton>
            </>
          ) : null}
          <Link href={urlPedido} className="ver-mas">
            Ver el detalle del pedido
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="envoltura acceso">
      <div className="tabla acceso-tabla">
        <h1>Paga tu pedido</h1>
        {pedido ? (
          <>
            <p>
              Pedido <strong>{pedido.orderNumber}</strong>
            </p>
            <p className="precio-pintado">{formatoPesos(pedido.totals.total)}</p>
            {pedido.paymentDueAt ? (
              <p className="nota-iva">Tus piezas están apartadas hasta el {fecha(pedido.paymentDueAt, true)}.</p>
            ) : null}
          </>
        ) : null}
        {error ? <Aviso tono="error">{error}</Aviso> : null}
        <Boton variante="accion" cargando={iniciando} onClick={pagar}>
          Pagar con Wompi
        </Boton>
        <p className="nota-iva">Te llevamos a la página segura de Wompi: tarjeta, PSE, Nequi o Bancolombia.</p>
        <Link href={urlPedido} className="ver-mas">
          Ver el detalle del pedido
        </Link>
      </div>
    </main>
  );
}
