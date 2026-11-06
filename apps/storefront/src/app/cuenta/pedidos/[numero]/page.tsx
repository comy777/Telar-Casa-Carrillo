"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Aviso, Esqueleto } from "@telar/ui";
import { errorMessage } from "@telar/api-client";
import { api } from "@/lib/api-browser";
import { AreaCuenta } from "@/features/account/area-cuenta";
import { DetallePedido } from "@/features/orders/detalle-pedido";

export default function PedidoCuenta({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = use(params);
  const pedido = useQuery({
    queryKey: ["pedido", numero],
    queryFn: async () => (await api.GET("/api/v1/account/orders/{orderNumber}", { params: { path: { orderNumber: numero } } })).data,
  });

  return (
    <AreaCuenta titulo="Detalle del pedido">
      <p>
        <Link href="/cuenta/pedidos">← Todos mis pedidos</Link>
      </p>
      {pedido.isPending ? (
        <Esqueleto alto={400} />
      ) : pedido.error ? (
        <Aviso tono="error">{errorMessage(pedido.error, "No encontramos ese pedido en tu cuenta.")}</Aviso>
      ) : pedido.data ? (
        <DetallePedido pedido={pedido.data} />
      ) : null}
    </AreaCuenta>
  );
}
