import Link from "next/link";
import { Zocalo } from "@telar/ui";
import { type ColumnaPie, type Ruta, TITULOS_PIE } from "@/lib/navegacion";

export interface DatosPie {
  descripcion?: string | null;
  ubicacion?: string | null;
  correo?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  redes?: Array<{ nombre: string; url: string }>;
}

interface Props {
  nombre: string;
  /** Columnas del pie con sus rutas activas, en orden (se configuran en el panel). */
  columnas: Array<{ columna: ColumnaPie; rutas: Ruta[] }>;
  categorias: Array<{ slug: string; name: string }>;
  /** Páginas publicadas desde el panel (políticas, envíos, garantías...). */
  paginas: Array<{ slug: string; title: string }>;
  datos?: DatosPie;
}

export function Pie({ nombre, columnas, categorias, paginas, datos }: Props) {
  const whatsapp = datos?.whatsapp?.replace(/\D/g, "");
  return (
    <>
      <Zocalo />
      <footer className="pie">
        <div className="envoltura">
          <div className="columnas">
            <div>
              <Link className="marca" href="/">
                {nombre}
              </Link>
              {datos?.descripcion ? <p>{datos.descripcion}</p> : null}
              {datos?.ubicacion ? <p>{datos.ubicacion}</p> : null}
              {datos?.correo ? (
                <p>
                  <a href={`mailto:${datos.correo}`}>{datos.correo}</a>
                </p>
              ) : null}
              {datos?.telefono ? (
                <p>
                  <a href={`tel:${datos.telefono.replace(/[^\d+]/g, "")}`}>{datos.telefono}</a>
                </p>
              ) : null}
              {whatsapp ? (
                <p>
                  <a href={`https://wa.me/${whatsapp}`} rel="noopener noreferrer" target="_blank">
                    Escríbenos por WhatsApp
                  </a>
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
            {columnas.map(({ columna, rutas }) => {
              const enlaces = rutas.flatMap((r) => {
                // Rutas que se despliegan en listas: categorías del catálogo y páginas del panel.
                if (r.key === "categorias") return categorias.map((c) => ({ href: `/categorias/${c.slug}`, texto: c.name }));
                if (r.key === "paginas") return paginas.map((p) => ({ href: `/${p.slug}`, texto: p.title }));
                return [{ href: r.path, texto: r.label }];
              });
              if (enlaces.length === 0) return null;
              return (
                <div key={columna}>
                  <h3>{TITULOS_PIE[columna]}</h3>
                  <ul>
                    {enlaces.map((e) => (
                      <li key={e.href}>
                        <Link href={e.href}>{e.texto}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          <div className="legal">
            <span>
              © {new Date().getFullYear()} {nombre}
            </span>
            <span>Precios en pesos colombianos con IVA incluido</span>
          </div>
        </div>
      </footer>
    </>
  );
}
