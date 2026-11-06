"use client";

import Link from "next/link";
import { Boton, EstadoVacio } from "@telar/ui";

export default function ErrorPagina({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="envoltura">
      <EstadoVacio
        titulo="Algo se enredó en el telar"
        accion={
          <div className="acciones-fila">
            <Boton variante="verde" onClick={reset}>
              Intentar de nuevo
            </Boton>
            <Link href="/" className="boton boton-texto">
              Volver al inicio
            </Link>
          </div>
        }
      >
        <p>No pudimos cargar esta página. Puede ser un problema de conexión; tus datos y tu carrito están a salvo.</p>
      </EstadoVacio>
    </main>
  );
}
