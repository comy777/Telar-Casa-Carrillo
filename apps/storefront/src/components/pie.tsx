import Link from "next/link";
import { Zocalo } from "@telar/ui";
import { STORE_NAME } from "@/lib/env";

export interface DatosPie {
  descripcion?: string | null;
  ubicacion?: string | null;
  correo?: string | null;
  telefono?: string | null;
  redes?: Array<{ nombre: string; url: string }>;
}

export function Pie({ categorias, datos }: { categorias: Array<{ slug: string; name: string }>; datos?: DatosPie }) {
  return (
    <>
      <Zocalo />
      <footer className="pie">
        <div className="envoltura">
          <div className="columnas">
            <div>
              <Link className="marca" href="/">
                {STORE_NAME}
              </Link>
              <p>{datos?.descripcion ?? "Ruanas, prendas y hamacas tejidas en telar por la familia Carrillo."}</p>
              {datos?.ubicacion ? <p>{datos.ubicacion}</p> : null}
              {datos?.correo ? (
                <p>
                  <a href={`mailto:${datos.correo}`}>{datos.correo}</a>
                </p>
              ) : null}
              {datos?.redes?.length ? (
                <ul className="redes">
                  {datos.redes.map((r) => (
                    <li key={r.url}>
                      <a href={r.url} rel="noopener noreferrer" target="_blank">
                        {r.nombre}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div>
              <h3>Tienda</h3>
              <ul>
                {categorias.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/categorias/${c.slug}`}>{c.name}</Link>
                  </li>
                ))}
                <li>
                  <Link href="/artesanos">La familia</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3>Ayuda</h3>
              <ul>
                <li>
                  <Link href="/cuenta/pedidos">Seguir mi pedido</Link>
                </li>
                <li>
                  <Link href="/envios">Envíos</Link>
                </li>
                <li>
                  <Link href="/cambios-y-devoluciones">Cambios y devoluciones</Link>
                </li>
                <li>
                  <Link href="/preguntas-frecuentes">Preguntas frecuentes</Link>
                </li>
                <li>
                  <Link href="/contacto">Contacto</Link>
                </li>
              </ul>
            </div>
            <div>
              <h3>Legal</h3>
              <ul>
                <li>
                  <Link href="/terminos-y-condiciones">Términos y condiciones</Link>
                </li>
                <li>
                  <Link href="/tratamiento-de-datos">Tratamiento de datos</Link>
                </li>
                <li>
                  <Link href="/derecho-de-retracto">Derecho de retracto</Link>
                </li>
                <li>
                  <Link href="/garantias">Garantías</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="legal">
            <span>
              © {new Date().getFullYear()} {STORE_NAME}
            </span>
            <span>Precios en pesos colombianos con IVA incluido</span>
          </div>
        </div>
      </footer>
    </>
  );
}
