import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getRelated } from "@/lib/catalog";
import { SITE_URL, STORE_NAME } from "@/lib/env";
import { FichaProducto } from "@/features/catalog/ficha-producto";
import { ListaPiezas } from "@/features/catalog/tarjeta-pieza";
import { Markdown } from "@/components/markdown";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return { title: "Pieza no encontrada" };
  return {
    title: p.seo.title,
    description: p.seo.description ?? p.shortDescription ?? undefined,
    alternates: { canonical: `/productos/${p.slug}` },
    openGraph: { title: p.seo.title, description: p.seo.description ?? undefined, images: p.seo.image ? [p.seo.image] : [] },
  };
}

const DISPONIBILIDAD = {
  IN_STOCK: "https://schema.org/InStock",
  LOW_STOCK: "https://schema.org/LimitedAvailability",
  OUT_OF_STOCK: "https://schema.org/OutOfStock",
} as const;

export default async function Producto({ params }: Props) {
  const { slug } = await params;
  const [p, relacionadas] = await Promise.all([getProduct(slug), getRelated(slug)]);
  if (!p) notFound();

  const categoria = p.categories[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: p.name,
        sku: p.sku,
        description: p.shortDescription ?? p.description.slice(0, 300),
        image: p.images.map((i) => i.url),
        brand: { "@type": "Brand", name: STORE_NAME },
        material: p.materials.join(", ") || undefined,
        offers: p.variants.map((v) => ({
          "@type": "Offer",
          sku: v.sku,
          price: v.price,
          priceCurrency: v.currency,
          availability: DISPONIBILIDAD[v.availability],
          url: `${SITE_URL}/productos/${p.slug}`,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Inicio", item: SITE_URL },
          ...(categoria
            ? [{ "@type": "ListItem", position: 2, name: categoria.name, item: `${SITE_URL}/categorias/${categoria.slug}` }]
            : []),
          { "@type": "ListItem", position: categoria ? 3 : 2, name: p.name },
        ],
      },
    ],
  };

  return (
    <main className="envoltura">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <p className="migas">
        <Link href="/">Inicio</Link> /{" "}
        {categoria ? (
          <>
            <Link href={`/categorias/${categoria.slug}`}>{categoria.name}</Link> /{" "}
          </>
        ) : (
          <>
            <Link href="/productos">Catálogo</Link> /{" "}
          </>
        )}
        <span aria-current="page">{p.name}</span>
      </p>

      <FichaProducto producto={p} />

      <section className="detalle" aria-label="Detalles de la pieza">
        <div>
          <h2>La pieza</h2>
          <Markdown texto={p.description} />
        </div>
        <div>
          <h2>Materiales y técnica</h2>
          {p.materials.length + p.techniques.length > 0 ? (
            <ul>
              {p.materials.map((m) => (
                <li key={m}>
                  <Link href={`/productos?q=${encodeURIComponent(m)}`}>{m}</Link>
                </li>
              ))}
              {p.techniques.map((t) => (
                <li key={t}>
                  <Link href={`/productos?tecnica=${encodeURIComponent(t)}`}>{t}</Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>La familia aún no ha cargado los materiales de esta pieza.</p>
          )}
        </div>
        {p.artisan ? (
          <div id="quien">
            <h2>Quién la tejió</h2>
            <div className="quien">
              <div className="retrato foto-real">
                {p.artisan.photoUrl ? <Image src={p.artisan.photoUrl} alt={p.artisan.name} fill sizes="96px" /> : null}
              </div>
              <div>
                <p>
                  <strong>{p.artisan.name}</strong>
                </p>
                {p.artisan.biography ? <p>{p.artisan.biography}</p> : null}
                <p>
                  <Link href={`/artesanos/${p.artisan.slug}`}>Ver todas sus piezas</Link>
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {relacionadas.length > 0 ? (
        <section className="seccion" aria-labelledby="t-relacionadas" style={{ paddingTop: 0 }}>
          <div className="cabecera">
            <h2 className="titulo" id="t-relacionadas">
              Del mismo telar
            </h2>
            {categoria ? <Link href={`/categorias/${categoria.slug}`}>Ver todas: {categoria.name.toLowerCase()}</Link> : null}
          </div>
          <ListaPiezas piezas={relacionadas} />
        </section>
      ) : null}
    </main>
  );
}
