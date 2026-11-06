import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EstadoVacio } from "@telar/ui";
import { getArtisans } from "@/lib/catalog";

export const revalidate = 120;
export const metadata: Metadata = {
  title: "La familia",
  description: "Quién teje cada ruana, prenda y hamaca de Telar Casa Carrillo.",
  alternates: { canonical: "/artesanos" },
};

export default async function Artesanos() {
  const { items } = await getArtisans({ pageSize: 50 });
  return (
    <main>
      <section className="seccion familia familia-pagina" aria-labelledby="t-familia">
        <div className="envoltura">
          <p className="migas migas-claras">
            <Link href="/">Inicio</Link> / La familia
          </p>
          <h1 className="titulo" id="t-familia">
            Quién teje cada pieza
          </h1>
          {items.length === 0 ? (
            <EstadoVacio titulo="Pronto conocerás a la familia" />
          ) : (
            <ul className="tejedores">
              {items.map((a) => (
                <li key={a.id} className="tejedor-ficha">
                  <Link href={`/artesanos/${a.slug}`}>
                    <div className="retrato foto-real">
                      {a.photoUrl ? <Image src={a.photoUrl} alt={a.name} fill sizes="(max-width: 760px) 50vw, 33vw" /> : null}
                    </div>
                    <h2 className="nombre-tejedor">{a.name}</h2>
                    {a.biography ? <p>{a.biography}</p> : null}
                    <p className="conteo-piezas">
                      {a.publishedProducts === 1 ? "1 pieza en la tienda" : `${a.publishedProducts} piezas en la tienda`}
                      {a.techniques.length > 0 ? ` · ${a.techniques.join(", ")}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
