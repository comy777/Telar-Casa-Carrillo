"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Aviso, Esqueleto } from "@telar/ui";
import { errorMessage, isApiError } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { useTokenPedido } from "@/lib/pedido-invitado";
import { DetallePedido } from "@/features/orders/detalle-pedido";

/** Pedido de invitado: se abre con el enlace del correo (el token pasa a la cabecera y sale de la URL). */
export default function PedidoInvitado({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = use(params);
  const listo = useTokenPedido(numero) !== undefined;

  const pedido = useQuery({
    queryKey: ["pedido-invitado", numero],
    queryFn: async () => (await api.GET("/api/v1/orders/{orderNumber}", { params: { path: { orderNumber: numero } } })).data,
    enabled: listo,
    retry: false,
  });

  return (
    <main className="envoltura cuenta">
      <p className="migas">
        <Link href="/">Inicio</Link> / Pedido {numero}
      </p>
      <h1 className="titulo-pagina">Tu pedido</h1>
      {!listo || pedido.isPending ? (
        <Esqueleto alto={400} />
      ) : pedido.error ? (
        <Aviso tono="error">
          {isApiError(pedido.error) && (pedido.error.status === 401 || pedido.error.status === 403 || pedido.error.status === 404)
            ? "No pudimos abrir este pedido. Usa el enlace completo del correo de confirmación o ingresa a tu cuenta."
            : errorMessage(pedido.error)}
        </Aviso>
      ) : pedido.data ? (
        <DetallePedido pedido={pedido.data} />
      ) : null}
    </main>
  );
}
