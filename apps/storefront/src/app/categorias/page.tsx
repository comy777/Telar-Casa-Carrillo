import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EstadoVacio } from "@telar/ui";
import { getCategories } from "@/lib/catalog";

export const revalidate = 120;
export const metadata: Metadata = {
  title: "Categorías",
  description: "Ruanas, prendas y hamacas tejidas en telar por la familia Carrillo.",
  alternates: { canonical: "/categorias" },
};

export default async function Categorias() {
  const categorias = await getCategories();
  return (
    <main className="envoltura seccion-pagina">
      <p className="migas">
        <Link href="/">Inicio</Link> / Categorías
      </p>
      <h1 className="titulo-pagina">Lo que sale del telar</h1>
      {categorias.length === 0 ? (
        <EstadoVacio titulo="Aún no hay categorías publicadas" />
      ) : (
        <div className="letreros letreros-pagina">
          {categorias.map((c) => (
            <Link key={c.id} className="letrero-cat" href={`/categorias/${c.slug}`}>
              {c.imageUrl ? <Image className="foto-cat" src={c.imageUrl} alt="" fill sizes="(max-width: 760px) 100vw, 33vw" /> : null}
              <span className="placa">
                <strong>{c.name}</strong>
                {c.description ? <span>{c.description}</span> : null}
                {c.children.length > 0 ? <span>{c.children.map((h) => h.name).join(" · ")}</span> : null}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
