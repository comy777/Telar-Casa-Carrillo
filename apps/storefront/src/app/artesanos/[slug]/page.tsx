import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArtisan, getProducts } from "@/lib/catalog";
import { ListaPiezas } from "@/features/catalog/tarjeta-pieza";
import { Markdown } from "@/components/markdown";

export const revalidate = 120;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = await getArtisan((await params).slug);
  if (!a) return { title: "Artesano no encontrado" };
  return {
    title: a.name,
    description: a.biography ?? `Piezas tejidas en telar por ${a.name}.`,
    alternates: { canonical: `/artesanos/${a.slug}` },
    openGraph: a.photoUrl ? { images: [a.photoUrl] } : undefined,
  };
}

export default async function Artesano({ params }: Props) {
  const { slug } = await params;
  const [a, piezas] = await Promise.all([getArtisan(slug), getProducts({ artisan: slug, pageSize: 24, sort: "newest" })]);
  if (!a) notFound();

  return (
    <main>
      <section className="perfil-tejedor" aria-labelledby="t-tejedor">
        <div className="envoltura">
          <div className="retrato-grande foto-real">
            {a.photoUrl ? <Image src={a.photoUrl} alt={a.name} fill priority sizes="(max-width: 900px) 100vw, 40vw" /> : null}
          </div>
          <div className="tabla">
            <p className="migas migas-claras">
              <Link href="/">Inicio</Link> / <Link href="/artesanos">La familia</Link>
            </p>
            <h1 id="t-tejedor">{a.name}</h1>
            {a.biography ? <p className="bio">{a.biography}</p> : null}
            {a.techniques.length > 0 ? (
              <>
                <h2 className="subtitulo-tabla">Técnicas</h2>
                <ul className="tecnicas">
                  {a.techniques.map((t) => (
                    <li key={t}>
                      <Link href={`/productos?tecnica=${encodeURIComponent(t)}`}>{t}</Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p className="nota-iva">
              {a.publishedProducts === 1 ? "1 pieza en la tienda" : `${a.publishedProducts} piezas en la tienda`}
            </p>
          </div>
        </div>
        <div className="zocalo" aria-hidden="true" />
      </section>

      {a.story ? (
        <section className="seccion" aria-labelledby="t-historia">
          <div className="envoltura">
            <h2 className="titulo" id="t-historia">
              Su historia
            </h2>
            <Markdown texto={a.story} className="prosa historia-texto" />
          </div>
        </section>
      ) : null}

      <section className="seccion" aria-labelledby="t-piezas">
        <div className="envoltura">
          <h2 className="titulo" id="t-piezas">
            Piezas de {a.name}
          </h2>
          {piezas.items.length > 0 ? (
            <ListaPiezas piezas={piezas.items} />
          ) : (
            <p>Por ahora no hay piezas suyas a la venta.</p>
          )}
        </div>
      </section>
    </main>
  );
}
