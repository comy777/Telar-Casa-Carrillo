"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Boton, EstadoVacio, Esqueleto, claseBoton, formatoPesos } from "@telar/ui";
import { api } from "@/lib/api-browser";
import { AreaCuenta } from "@/features/account/area-cuenta";
import { InsigniaEstado, fecha } from "@/features/orders/detalle-pedido";

const POR_PAGINA = 10;

export default function MisPedidos() {
  const [pagina, setPagina] = useState(1);
  const pedidos = useQuery({
    queryKey: ["mis-pedidos", pagina],
    queryFn: async () =>
      (await api.GET("/api/v1/account/orders", { params: { query: { page: pagina, pageSize: POR_PAGINA } as never } })).data,
  });
  const total = pedidos.data?.total ?? 0;

  return (
    <AreaCuenta titulo="Mis pedidos">
      {pedidos.isPending ? (
        <Esqueleto alto={240} />
      ) : total === 0 ? (
        <EstadoVacio
          titulo="Todavía no tienes pedidos"
          accion={
            <Link href="/productos" className={claseBoton("verde")}>
              Ver el catálogo
            </Link>
          }
        />
      ) : (
        <>
          <ul className="lista-pedidos">
            {pedidos.data?.items.map((p) => (
              <li key={p.orderNumber}>
                <Link href={`/cuenta/pedidos/${p.orderNumber}`} className="fila-pedido">
                  <span className="pedido-numero">{p.orderNumber}</span>
                  <span>{fecha(p.createdAt)}</span>
                  <span>
                    {p.items.reduce((n, i) => n + i.quantity, 0)} {p.items.length === 1 && p.items[0]!.quantity === 1 ? "pieza" : "piezas"}
                  </span>
                  <InsigniaEstado estado={p.status} />
                  <strong>{formatoPesos(p.totals.total)}</strong>
                </Link>
              </li>
            ))}
          </ul>
          {total > POR_PAGINA ? (
            <div className="acciones-fila">
              <Boton variante="texto" disabled={pagina === 1} onClick={() => setPagina((p) => p - 1)}>
                Anteriores
              </Boton>
              <span>
                Página {pagina} de {Math.ceil(total / POR_PAGINA)}
              </span>
              <Boton variante="texto" disabled={pagina * POR_PAGINA >= total} onClick={() => setPagina((p) => p + 1)}>
                Siguientes
              </Boton>
            </div>
          ) : null}
        </>
      )}
    </AreaCuenta>
  );
}
