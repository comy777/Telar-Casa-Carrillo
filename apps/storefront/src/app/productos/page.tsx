import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { leerFiltros } from "@/features/catalog/busqueda";
import { VistaCatalogo } from "@/features/catalog/vista-catalogo";
import { CargandoCatalogo } from "@/features/catalog/cargando";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const f = leerFiltros(await searchParams);
  const filtrado = Object.keys(f).length > 0;
  return {
    title: f.q ? `Resultados para «${f.q}»` : "Todas las piezas",
    description: "Ruanas, prendas y hamacas tejidas en telar por la familia Carrillo. Precios con IVA incluido y envío a toda Colombia.",
    alternates: { canonical: "/productos" },
    // Las combinaciones de filtros no se indexan; la página base sí.
    robots: filtrado ? { index: false, follow: true } : undefined,
  };
}

export default async function Catalogo({ searchParams }: Props) {
  const filtros = leerFiltros(await searchParams);
  return (
    <main className="envoltura">
      <p className="migas">
        <Link href="/">Inicio</Link> / Catálogo
      </p>
      <div className="catalogo-cabeza">
        <div>
          <h1>Todas las piezas</h1>
          <p>Ruanas, prendas y hamacas tejidas en telar por la familia Carrillo.</p>
        </div>
      </div>
      <Suspense key={JSON.stringify(filtros)} fallback={<CargandoCatalogo />}>
        <VistaCatalogo base="/productos" filtros={filtros} />
      </Suspense>
    </main>
  );
}
