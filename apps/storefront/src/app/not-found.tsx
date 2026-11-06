import Link from "next/link";
import { EstadoVacio, claseBoton } from "@telar/ui";

export default function NoEncontrado() {
  return (
    <main className="envoltura">
      <EstadoVacio
        titulo="Esta página no está en el puesto"
        accion={
          <Link href="/productos" className={claseBoton("verde")}>
            Ver todas las piezas
          </Link>
        }
      >
        <p>Puede que la pieza ya no esté a la venta o que el enlace tenga un error.</p>
      </EstadoVacio>
    </main>
  );
}
