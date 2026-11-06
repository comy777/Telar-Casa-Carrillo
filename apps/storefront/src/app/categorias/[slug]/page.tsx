import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCategory } from "@/lib/catalog";
import { leerFiltros } from "@/features/catalog/busqueda";
import { VistaCatalogo } from "@/features/catalog/vista-catalogo";
import { CargandoCatalogo } from "@/features/catalog/cargando";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const c = await getCategory((await params).slug);
  if (!c) return { title: "Categoría no encontrada" };
  const filtrado = Object.keys(leerFiltros(await searchParams)).length > 0;
  return {
    title: c.category.name,
    description: c.category.description ?? `${c.category.name} tejidas en telar por la familia Carrillo.`,
    alternates: { canonical: `/categorias/${c.category.slug}` },
    openGraph: c.category.imageUrl ? { images: [c.category.imageUrl] } : undefined,
    robots: filtrado ? { index: false, follow: true } : undefined,
  };
}

export default async function Categoria({ params, searchParams }: Props) {
  const { slug } = await params;
  const [pagina, filtros] = await Promise.all([getCategory(slug), searchParams.then(leerFiltros)]);
  if (!pagina) notFound();
  const { category, breadcrumbs, children } = pagina;
  const base = `/categorias/${category.slug}`;

  return (
    <main className="envoltura">
      <p className="migas">
        <Link href="/">Inicio</Link> / <Link href="/categorias">Categorías</Link>
        {breadcrumbs
          .filter((b) => b.slug !== category.slug)
          .map((b) => (
            <span key={b.slug}>
              {" "}
              / <Link href={`/categorias/${b.slug}`}>{b.name}</Link>
            </span>
          ))}{" "}
        / <span aria-current="page">{category.name}</span>
      </p>
      <div className="catalogo-cabeza">
        <div>
          <h1>{category.name}</h1>
          {category.description ? <p>{category.description}</p> : null}
        </div>
      </div>
      {children.length > 0 ? (
        <nav aria-label="Subcategorías" className="subcategorias">
          {children.map((h) => (
            <Link key={h.id} href={`/categorias/${h.slug}`} className="boton boton-borde">
              {h.name}
            </Link>
          ))}
        </nav>
      ) : null}
      <Suspense key={JSON.stringify(filtros)} fallback={<CargandoCatalogo />}>
        <VistaCatalogo base={base} filtros={filtros} categoriaFija={category.slug} />
      </Suspense>
    </main>
  );
}
